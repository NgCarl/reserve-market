import type { ModePaiement, Prisma, StatutLigne } from '../generated/prisma/client.js'
import { ConflictError, NotFoundError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import { DUREE_SERVICE_MS, formaterAppel, selectAppel, type AppelSalle } from './appel.service.js'
import { diffuser, diffuserAppelTraite } from './diffusion.service.js'

// Service en salle, sur le téléphone du serveur : servir, encaisser, répondre aux appels (§6, §7).

const selectLigneSalle = {
  id: true,
  nomPlat: true,
  quantite: true,
  prixUnitaire: true,
  chaise: true,
  note: true,
  statut: true,
  poste: true,
  options: { orderBy: { id: 'asc' }, select: { libelle: true } },
} as const satisfies Prisma.LigneCommandeSelect

type LigneSalleBrute = Prisma.LigneCommandeGetPayload<{ select: typeof selectLigneSalle }>

const formaterLigne = (ligne: LigneSalleBrute, commandeId: number, creeLe: Date) => ({
  id: ligne.id,
  commandeId,
  creeLe: creeLe.toISOString(),
  nomPlat: ligne.nomPlat,
  quantite: ligne.quantite,
  prixUnitaire: ligne.prixUnitaire,
  chaise: ligne.chaise,
  note: ligne.note,
  statut: ligne.statut,
  poste: ligne.poste,
  options: ligne.options.map((option) => option.libelle),
})

export type LigneSalle = ReturnType<typeof formaterLigne>

const EN_COURS: readonly StatutLigne[] = ['RECUE', 'EN_PREPARATION']

/**
 * Vue d'ensemble de la salle : chaque table qui a des commandes non encaissées du service ou un appel en attente,
 * avec ce qui est prêt à servir, ce qui est en cours et le montant à encaisser.
 */
export async function etatSalle(restaurantId: number) {
  const depuis = new Date(Date.now() - DUREE_SERVICE_MS)
  const [tables, commandes, appels] = await Promise.all([
    prisma.table.findMany({ where: { restaurantId, actif: true }, orderBy: { numero: 'asc' }, select: { id: true, numero: true, nombreChaises: true } }),
    prisma.commande.findMany({
      where: { restaurantId, encaisseeAt: null, createdAt: { gte: depuis } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, tableId: true, lignes: { orderBy: { id: 'asc' }, select: selectLigneSalle } },
    }),
    prisma.appelTable.findMany({
      where: { restaurantId, traiteAt: null, createdAt: { gte: depuis } },
      orderBy: { createdAt: 'asc' },
      select: selectAppel,
    }),
  ])

  const parTable = new Map(tables.map((table) => [table.id, { table, lignes: [] as LigneSalle[], commandeIds: [] as number[], total: 0 }]))
  for (const commande of commandes) {
    const entree = parTable.get(commande.tableId)
    if (!entree) continue
    const valides = commande.lignes.filter((ligne) => ligne.statut !== 'ANNULEE')
    if (valides.length === 0) continue
    entree.commandeIds.push(commande.id)
    for (const ligne of valides) {
      entree.lignes.push(formaterLigne(ligne, commande.id, commande.createdAt))
      entree.total += ligne.prixUnitaire * ligne.quantite
    }
  }

  const appelsFormates: AppelSalle[] = appels.map((appel) => formaterAppel(appel, parTable.get(appel.table.id)?.total ?? 0))
  const tablesActives = [...parTable.values()]
    .map((entree) => ({
      table: entree.table,
      total: entree.total,
      commandeIds: entree.commandeIds,
      aServir: entree.lignes.filter((ligne) => ligne.statut === 'PRETE'),
      enCours: entree.lignes.filter((ligne) => EN_COURS.includes(ligne.statut)),
      servies: entree.lignes.filter((ligne) => ligne.statut === 'SERVIE'),
      appels: appelsFormates.filter((appel) => appel.table.id === entree.table.id),
    }))
    .filter((entree) => entree.commandeIds.length > 0 || entree.appels.length > 0)
    // Les tables qui appellent d'abord, puis celles qui ont des plats prêts, puis par numéro.
    .sort((a, b) => b.appels.length - a.appels.length || b.aServir.length - a.aServir.length || a.table.numero - b.table.numero)

  return { appels: appelsFormates, tables: tablesActives, toutesLesTables: tables }
}

export async function servirLignes(restaurantId: number, serveurId: number, ligneIds: readonly number[]): Promise<void> {
  const maintenant = new Date()
  const commandeIds = await prisma.$transaction(async (tx) => {
    // Transition vérifiée (§6) : seul un article prêt passe servi. Deux serveurs sur le même plat : le second ne modifie rien.
    const { count } = await tx.ligneCommande.updateMany({
      where: { id: { in: [...ligneIds] }, statut: 'PRETE', commande: { restaurantId } },
      data: { statut: 'SERVIE', servieAt: maintenant, servieParId: serveurId },
    })
    if (count !== ligneIds.length) throw new ConflictError('Déjà servi, ou pas encore prêt. La liste a été actualisée.')
    const lignes = await tx.ligneCommande.findMany({ where: { id: { in: [...ligneIds] } }, distinct: ['commandeId'], select: { commandeId: true } })
    return lignes.map((ligne) => ligne.commandeId)
  })
  diffuser(commandeIds, 'commande:statut')
}

/** Le serveur annule un article tant qu'il n'est pas en préparation ; ensuite, seule la cuisine peut le faire (§6). */
export async function annulerLigneServeur(restaurantId: number, serveurId: number, ligneId: number, motif: string): Promise<void> {
  const ligne = await prisma.ligneCommande.findFirst({ where: { id: ligneId, commande: { restaurantId } }, select: { commandeId: true, statut: true } })
  if (!ligne) throw new NotFoundError('Article introuvable')
  const { count } = await prisma.ligneCommande.updateMany({
    where: { id: ligneId, statut: 'RECUE' },
    data: { statut: 'ANNULEE', annuleeAt: new Date(), annuleeParId: serveurId, motifAnnulation: motif },
  })
  if (count === 0) {
    throw new ConflictError(ligne.statut === 'ANNULEE'
      ? 'Article déjà annulé.'
      : 'Préparation déjà commencée : seule la cuisine peut encore annuler cet article.')
  }
  diffuser([ligne.commandeId], 'commande:annulee')
}

/**
 * Le serveur a reçu l'argent : toutes les commandes non encaissées de la table passent encaissées, en une transaction.
 * C'est ce statut, et lui seul, qui alimente le total encaissé (§6). Les demandes d'addition de la table sont closes.
 */
export async function encaisserTable(restaurantId: number, serveurId: number, tableId: number, modePaiement: ModePaiement) {
  const maintenant = new Date()
  const resultat = await prisma.$transaction(async (tx) => {
    const commandes = await tx.commande.findMany({
      where: {
        tableId,
        restaurantId,
        encaisseeAt: null,
        createdAt: { gte: new Date(Date.now() - DUREE_SERVICE_MS) },
        lignes: { some: { statut: { not: 'ANNULEE' } } },
      },
      select: { id: true, lignes: { where: { statut: { not: 'ANNULEE' } }, select: { prixUnitaire: true, quantite: true } } },
    })
    if (commandes.length === 0) throw new ConflictError('Rien à encaisser pour cette table.')
    const ids = commandes.map((commande) => commande.id)
    // Conditionnel : si un autre serveur vient d'encaisser, rien n'est modifié deux fois.
    const { count } = await tx.commande.updateMany({
      where: { id: { in: ids }, encaisseeAt: null },
      data: { encaisseeAt: maintenant, encaisseeParId: serveurId, modePaiement },
    })
    if (count !== ids.length) throw new ConflictError('Table déjà encaissée par un autre serveur. La liste a été actualisée.')

    const additions = await tx.appelTable.findMany({ where: { tableId, type: 'ADDITION', traiteAt: null }, select: { id: true } })
    await tx.appelTable.updateMany({ where: { id: { in: additions.map((appel) => appel.id) } }, data: { traiteAt: maintenant, traiteParId: serveurId } })
    return {
      ids,
      additionIds: additions.map((appel) => appel.id),
      montant: commandes.reduce((total, commande) => total + commande.lignes.reduce((somme, ligne) => somme + ligne.prixUnitaire * ligne.quantite, 0), 0),
    }
  })

  // Le client voit « Payée » sur son suivi ; les autres serveurs voient la table se libérer.
  diffuser(resultat.ids, 'commande:statut')
  for (const appelId of resultat.additionIds) diffuserAppelTraite(restaurantId, appelId)
  return { commandes: resultat.ids.length, montant: resultat.montant, modePaiement }
}

export async function traiterAppel(restaurantId: number, serveurId: number, appelId: number): Promise<void> {
  const { count } = await prisma.appelTable.updateMany({
    where: { id: appelId, restaurantId, traiteAt: null },
    data: { traiteAt: new Date(), traiteParId: serveurId },
  })
  if (count === 0) throw new ConflictError('Appel déjà traité par un autre serveur.')
  diffuserAppelTraite(restaurantId, appelId)
}
