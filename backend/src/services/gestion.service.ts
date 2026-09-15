import type { Prisma } from '../generated/prisma/client.js'
import { NotFoundError } from '../lib/errors.js'
import { bornesJournee } from '../lib/journee.js'
import { prisma } from '../lib/prisma.js'
import type { CommandesQuery } from '../schemas/gestion.schema.js'
import { statutCommande } from './commande.format.js'

// Suivi du restaurant par l'admin : commandes d'une journée, détail d'une commande, tableau de bord.

const selectCommandeAdmin = {
  id: true,
  createdAt: true,
  source: true,
  urgent: true,
  modePaiement: true,
  encaisseeAt: true,
  table: { select: { numero: true } },
  saisiePar: { select: { nom: true } },
  encaisseePar: { select: { nom: true } },
  lignes: {
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nomPlat: true,
      prixUnitaire: true,
      quantite: true,
      poste: true,
      chaise: true,
      note: true,
      statut: true,
      preparationAt: true,
      preteAt: true,
      servieAt: true,
      annuleeAt: true,
      motifAnnulation: true,
      serviePar: { select: { nom: true } },
      annuleePar: { select: { nom: true } },
      options: { orderBy: { id: 'asc' }, select: { libelle: true, prix: true } },
    },
  },
} as const satisfies Prisma.CommandeSelect

type CommandeAdminBrute = Prisma.CommandeGetPayload<{ select: typeof selectCommandeAdmin }>

const iso = (date: Date | null): string | null => date?.toISOString() ?? null

function formaterCommandeAdmin(commande: CommandeAdminBrute) {
  // Les articles annulés ne comptent ni dans le total ni dans le nombre d'articles.
  const valides = commande.lignes.filter((ligne) => ligne.statut !== 'ANNULEE')
  return {
    id: commande.id,
    creeLe: commande.createdAt.toISOString(),
    source: commande.source,
    urgent: commande.urgent,
    table: { numero: commande.table.numero },
    saisiePar: commande.saisiePar?.nom ?? null,
    statut: statutCommande(commande.lignes.map((ligne) => ligne.statut)),
    total: valides.reduce((total, ligne) => total + ligne.prixUnitaire * ligne.quantite, 0),
    articles: valides.reduce((total, ligne) => total + ligne.quantite, 0),
    places: [...new Set(commande.lignes.map((ligne) => ligne.chaise).filter((chaise) => chaise !== null))].sort((a, b) => a - b),
    paiement: {
      mode: commande.modePaiement,
      encaisseeLe: iso(commande.encaisseeAt),
      encaisseePar: commande.encaisseePar?.nom ?? null,
    },
    lignes: commande.lignes.map((ligne) => ({
      id: ligne.id,
      nomPlat: ligne.nomPlat,
      prixUnitaire: ligne.prixUnitaire,
      quantite: ligne.quantite,
      poste: ligne.poste,
      chaise: ligne.chaise,
      note: ligne.note,
      statut: ligne.statut,
      options: ligne.options,
      preparationLe: iso(ligne.preparationAt),
      preteLe: iso(ligne.preteAt),
      servieLe: iso(ligne.servieAt),
      annuleeLe: iso(ligne.annuleeAt),
      servieParNom: ligne.serviePar?.nom ?? null,
      annuleeParNom: ligne.annuleePar?.nom ?? null,
      motifAnnulation: ligne.motifAnnulation,
    })),
  }
}

export type CommandeAdmin = ReturnType<typeof formaterCommandeAdmin>

/** Ligne d'une liste : sans le détail des articles. */
function resumer(commande: CommandeAdmin) {
  return {
    id: commande.id,
    creeLe: commande.creeLe,
    source: commande.source,
    urgent: commande.urgent,
    table: commande.table,
    statut: commande.statut,
    total: commande.total,
    articles: commande.articles,
    places: commande.places,
    encaissee: commande.paiement.encaisseeLe !== null,
  }
}

async function commandesDeLaJournee(restaurantId: number, debut: Date, fin: Date, numeroTable?: number): Promise<CommandeAdmin[]> {
  const commandes = await prisma.commande.findMany({
    where: {
      restaurantId,
      createdAt: { gte: debut, lt: fin },
      ...(numeroTable === undefined ? {} : { table: { numero: numeroTable } }),
    },
    orderBy: { createdAt: 'desc' },
    select: selectCommandeAdmin,
  })
  return commandes.map((commande) => formaterCommandeAdmin(commande))
}

export async function listerCommandesJournee(restaurantId: number, filtres: CommandesQuery) {
  const { jour, debut, fin } = bornesJournee(filtres.date)
  const commandes = await commandesDeLaJournee(restaurantId, debut, fin, filtres.table)
  // Le statut d'une commande se déduit de ses lignes : il se filtre après calcul.
  const retenues = filtres.statut ? commandes.filter((commande) => commande.statut === filtres.statut) : commandes
  return {
    jour,
    commandes: retenues.map(resumer),
    total: retenues.reduce((total, commande) => total + commande.total, 0),
  }
}

export async function obtenirCommandeAdmin(restaurantId: number, commandeId: number): Promise<CommandeAdmin> {
  const commande = await prisma.commande.findFirst({ where: { id: commandeId, restaurantId }, select: selectCommandeAdmin })
  if (!commande) throw new NotFoundError('Commande introuvable')
  return formaterCommandeAdmin(commande)
}

const STATUTS_EN_COURS = new Set(['RECUE', 'EN_PREPARATION', 'PRETE'])

export async function tableauDeBord(restaurantId: number, date?: string) {
  const { jour, debut, fin } = bornesJournee(date)
  const [commandes, encaissees] = await Promise.all([
    commandesDeLaJournee(restaurantId, debut, fin),
    // L'argent reçu ce jour-là, même pour une commande de la veille : seul le serveur pose encaisseeAt (§6).
    prisma.commande.findMany({
      where: { restaurantId, encaisseeAt: { gte: debut, lt: fin } },
      select: { lignes: { where: { statut: { not: 'ANNULEE' } }, select: { prixUnitaire: true, quantite: true } } },
    }),
  ])

  const valides = commandes.filter((commande) => commande.statut !== 'ANNULEE')
  const chiffreAffaires = valides.reduce((total, commande) => total + commande.total, 0)

  const parPlat = new Map<string, { nomPlat: string; quantite: number; montant: number }>()
  for (const commande of valides) {
    for (const ligne of commande.lignes) {
      if (ligne.statut === 'ANNULEE') continue
      const plat = parPlat.get(ligne.nomPlat) ?? { nomPlat: ligne.nomPlat, quantite: 0, montant: 0 }
      plat.quantite += ligne.quantite
      plat.montant += ligne.prixUnitaire * ligne.quantite
      parPlat.set(ligne.nomPlat, plat)
    }
  }

  return {
    jour,
    commandes: valides.length,
    chiffreAffaires,
    totalEncaisse: encaissees.reduce(
      (total, commande) => total + commande.lignes.reduce((somme, ligne) => somme + ligne.prixUnitaire * ligne.quantite, 0),
      0,
    ),
    panierMoyen: valides.length > 0 ? Math.round(chiffreAffaires / valides.length) : 0,
    enCours: commandes.filter((commande) => STATUTS_EN_COURS.has(commande.statut)).length,
    platsPopulaires: [...parPlat.values()].sort((a, b) => b.quantite - a.quantite || b.montant - a.montant).slice(0, 5),
    dernieresCommandes: commandes.slice(0, 5).map(resumer),
  }
}
