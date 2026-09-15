import type { Prisma, StatutLigne } from '../generated/prisma/client.js'

// Formats des commandes renvoyés par l'API et diffusés en temps réel. Dans un fichier à part pour que
// commande.service, cuisine.service et diffusion.service les partagent sans dépendance circulaire.

const ORDRE_STATUTS: readonly StatutLigne[] = ['RECUE', 'EN_PREPARATION', 'PRETE', 'SERVIE']

/**
 * Statut vu par le client. Le statut est porté par chaque ligne (le bar et la cuisine avancent séparément) :
 * la commande est « en préparation » dès qu'une ligne a commencé, « prête » quand toutes le sont.
 */
export function statutCommande(statuts: readonly StatutLigne[]): StatutLigne {
  const rangs = statuts.filter((statut) => statut !== 'ANNULEE').map((statut) => ORDRE_STATUTS.indexOf(statut))
  if (rangs.length === 0) return 'ANNULEE'
  const moinsAvancee = Math.min(...rangs)
  if (moinsAvancee === 0 && Math.max(...rangs) > 0) return 'EN_PREPARATION'
  return ORDRE_STATUTS[moinsAvancee] ?? 'RECUE'
}

// ——— Format public : le client qui suit sa commande ———

export const selectCommandePublique = {
  id: true,
  createdAt: true,
  encaisseeAt: true,
  table: { select: { numero: true } },
  lignes: {
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nomPlat: true,
      quantite: true,
      prixUnitaire: true,
      chaise: true,
      note: true,
      statut: true,
      options: { orderBy: { id: 'asc' }, select: { libelle: true } },
    },
  },
} as const satisfies Prisma.CommandeSelect

type CommandePubliqueBrute = Prisma.CommandeGetPayload<{ select: typeof selectCommandePublique }>

export function formaterCommande(commande: CommandePubliqueBrute) {
  const actives = commande.lignes.filter((ligne) => ligne.statut !== 'ANNULEE')
  return {
    id: commande.id,
    creeLe: commande.createdAt.toISOString(),
    table: { numero: commande.table.numero },
    chaise: commande.lignes[0]?.chaise ?? null,
    // Posé par le serveur quand il a reçu l'argent : le client voit « Payée » sur son suivi.
    encaissee: commande.encaisseeAt !== null,
    statut: statutCommande(commande.lignes.map((ligne) => ligne.statut)),
    total: actives.reduce((total, ligne) => total + ligne.prixUnitaire * ligne.quantite, 0),
    lignes: commande.lignes.map((ligne) => ({
      id: ligne.id,
      nomPlat: ligne.nomPlat,
      quantite: ligne.quantite,
      prixUnitaire: ligne.prixUnitaire,
      note: ligne.note,
      statut: ligne.statut,
      options: ligne.options.map((option) => option.libelle),
    })),
  }
}

export type CommandePublique = ReturnType<typeof formaterCommande>

// ——— Format du personnel : écran cuisine, et plus tard téléphone du serveur ———

/** Contient aussi tout ce que demande le format public : diffusion.service charge la commande une seule fois pour les deux. */
export const selectCommandeCuisine = {
  id: true,
  createdAt: true,
  urgent: true,
  encaisseeAt: true,
  table: { select: { id: true, numero: true } },
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
      motifAnnulation: true,
      options: { orderBy: { id: 'asc' }, select: { libelle: true } },
    },
  },
} as const satisfies Prisma.CommandeSelect

type CommandeCuisineBrute = Prisma.CommandeGetPayload<{ select: typeof selectCommandeCuisine }>

export function formaterCommandeCuisine(commande: CommandeCuisineBrute) {
  return {
    id: commande.id,
    creeLe: commande.createdAt.toISOString(),
    urgent: commande.urgent,
    table: { id: commande.table.id, numero: commande.table.numero },
    lignes: commande.lignes.map((ligne) => ({
      id: ligne.id,
      nomPlat: ligne.nomPlat,
      quantite: ligne.quantite,
      poste: ligne.poste,
      chaise: ligne.chaise,
      note: ligne.note,
      statut: ligne.statut,
      options: ligne.options.map((option) => option.libelle),
      preparationLe: ligne.preparationAt?.toISOString() ?? null,
      preteLe: ligne.preteAt?.toISOString() ?? null,
      motifAnnulation: ligne.motifAnnulation,
    })),
  }
}

export type CommandeCuisine = ReturnType<typeof formaterCommandeCuisine>
