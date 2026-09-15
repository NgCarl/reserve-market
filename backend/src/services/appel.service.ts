import type { ModePaiement, Prisma, TypeAppel } from '../generated/prisma/client.js'
import { ConflictError, NotFoundError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import type { DemandeAppel } from '../schemas/salle.schema.js'
import { diffuserAppel } from './diffusion.service.js'

/** Même fenêtre que le suivi client : l'addition porte sur les commandes non encaissées des 12 dernières heures. */
export const DUREE_SERVICE_MS = 12 * 60 * 60 * 1000

export const selectAppel = {
  id: true,
  type: true,
  modePaiement: true,
  createdAt: true,
  table: { select: { id: true, numero: true } },
} as const satisfies Prisma.AppelTableSelect

type AppelBrut = Prisma.AppelTableGetPayload<{ select: typeof selectAppel }>

export interface AppelSalle {
  id: number
  type: TypeAppel
  modePaiement: ModePaiement | null
  /** Date ISO de l'appel. */
  creeLe: string
  table: { id: number; numero: number }
  /** Addition : montant à régler au moment de l'appel. */
  montant: number | null
}

export const formaterAppel = (appel: AppelBrut, montant: number | null): AppelSalle => ({
  id: appel.id,
  type: appel.type,
  modePaiement: appel.modePaiement,
  creeLe: appel.createdAt.toISOString(),
  table: appel.table,
  montant: appel.type === 'ADDITION' ? montant : null,
})

/** Addition d'une table : ses commandes non encaissées du service, hors articles annulés. */
export async function montantAddition(tableId: number): Promise<number> {
  const lignes = await prisma.ligneCommande.findMany({
    where: {
      statut: { not: 'ANNULEE' },
      commande: { tableId, encaisseeAt: null, createdAt: { gte: new Date(Date.now() - DUREE_SERVICE_MS) } },
    },
    select: { prixUnitaire: true, quantite: true },
  })
  return lignes.reduce((total, ligne) => total + ligne.prixUnitaire * ligne.quantite, 0)
}

/**
 * Le client appelle le serveur ou demande l'addition. Rien n'est payé ici (§6) : le serveur est seulement prévenu.
 * Un appel du même type déjà en attente n'est pas dupliqué : il est mis à jour (mode de paiement) et relancé.
 */
export async function appelerDepuisTable(jeton: string, demande: DemandeAppel): Promise<AppelSalle> {
  const table = await prisma.table.findFirst({ where: { jeton, actif: true }, select: { id: true, restaurantId: true } })
  if (!table) throw new NotFoundError('Table introuvable : scannez à nouveau le QR code posé sur votre table')

  const modePaiement = demande.type === 'ADDITION' ? demande.modePaiement : null
  let montant: number | null = null
  if (demande.type === 'ADDITION') {
    montant = await montantAddition(table.id)
    if (montant === 0) throw new ConflictError('Aucune commande à régler pour cette table.')
  }

  const enAttente = await prisma.appelTable.findFirst({
    where: { tableId: table.id, type: demande.type, traiteAt: null },
    select: { id: true },
  })
  const appel = enAttente
    ? await prisma.appelTable.update({ where: { id: enAttente.id }, data: { modePaiement }, select: selectAppel })
    : await prisma.appelTable.create({
      data: { restaurantId: table.restaurantId, tableId: table.id, type: demande.type, modePaiement },
      select: selectAppel,
    })

  const resultat = formaterAppel(appel, montant)
  diffuserAppel(table.restaurantId, resultat)
  return resultat
}
