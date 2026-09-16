import type { Poste, Role, StatutLigne } from '../generated/prisma/client.js'
import { ConflictError, ForbiddenError, NotFoundError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import { formaterCommandeCuisine, selectCommandeCuisine, type CommandeCuisine } from './commande.format.js'
import { diffuser } from './diffusion.service.js'

/** Une commande quitte l'écran cuisine 12 h après son envoi, même si personne ne l'a marquée servie. */
const DUREE_SERVICE_MS = 12 * 60 * 60 * 1000

const STATUTS_EN_COURS: StatutLigne[] = ['RECUE', 'EN_PREPARATION', 'PRETE']

export type StatutCuisine = 'EN_PREPARATION' | 'PRETE'

// Statuts de départ acceptés (§6). Une boisson peut passer directement de « reçue » à « prête ».
// « Servie » est réservée au serveur (étape 8).
const DEPARTS: Record<StatutCuisine, StatutLigne[]> = {
  EN_PREPARATION: ['RECUE'],
  PRETE: ['RECUE', 'EN_PREPARATION'],
}

/**
 * Files séparées (§10) : la cuisine prépare les plats, le bar les boissons. Un cuisinier ne voit donc que les lignes
 * du poste CUISINE, un barman celles du poste BAR ; l'admin voit les deux files.
 */
export const postesDuRole = (role: Role): Poste[] =>
  role === 'CUISINE' ? ['CUISINE'] : role === 'BAR' ? ['BAR'] : ['CUISINE', 'BAR']

/** Ne garde que les lignes du poste, et écarte les commandes qui n'en ont aucune. */
const pourLePoste = (commandes: CommandeCuisine[], postes: readonly Poste[]): CommandeCuisine[] =>
  commandes
    .map((commande) => ({ ...commande, lignes: commande.lignes.filter((ligne) => postes.includes(ligne.poste)) }))
    .filter((commande) => commande.lignes.length > 0)

/** Un poste ne modifie jamais les articles d'un autre : vérifié côté serveur, pas seulement à l'écran. */
async function exigerMemePoste(ligneIds: readonly number[], postes: readonly Poste[]): Promise<void> {
  const etrangeres = await prisma.ligneCommande.count({ where: { id: { in: [...ligneIds] }, poste: { notIn: [...postes] } } })
  if (etrangeres > 0) throw new ForbiddenError('Ces articles sont préparés par un autre poste.')
}

async function commandesParIds(restaurantId: number, commandeIds: readonly number[], postes: readonly Poste[]): Promise<CommandeCuisine[]> {
  const commandes = await prisma.commande.findMany({
    where: { id: { in: [...commandeIds] }, restaurantId },
    orderBy: { createdAt: 'asc' },
    select: selectCommandeCuisine,
  })
  return pourLePoste(commandes.map((commande) => formaterCommandeCuisine(commande)), postes)
}

/** Chargement de l'écran et rattrapage après une coupure (§7) : les commandes du service qui ont encore une ligne en cours. */
export async function listerCommandesCuisine(restaurantId: number, postes: readonly Poste[]): Promise<CommandeCuisine[]> {
  const commandes = await prisma.commande.findMany({
    where: {
      restaurantId,
      createdAt: { gte: new Date(Date.now() - DUREE_SERVICE_MS) },
      lignes: { some: { statut: { in: STATUTS_EN_COURS }, poste: { in: [...postes] } } },
    },
    orderBy: { createdAt: 'asc' },
    select: selectCommandeCuisine,
  })
  return pourLePoste(commandes.map((commande) => formaterCommandeCuisine(commande)), postes)
}

export async function changerStatutLignes(
  restaurantId: number,
  ligneIds: readonly number[],
  statut: StatutCuisine,
  postes: readonly Poste[],
): Promise<CommandeCuisine[]> {
  await exigerMemePoste(ligneIds, postes)
  const maintenant = new Date()
  const commandeIds = await prisma.$transaction(async (tx) => {
    // Transition vérifiée (§6) : seules les lignes encore au statut de départ attendu changent.
    // Deux cuisiniers qui appuient en même temps : le second ne modifie rien.
    const { count } = await tx.ligneCommande.updateMany({
      where: { id: { in: [...ligneIds] }, statut: { in: DEPARTS[statut] }, commande: { restaurantId } },
      data: statut === 'EN_PREPARATION' ? { statut, preparationAt: maintenant } : { statut, preteAt: maintenant },
    })
    // Tout ou rien : si une seule ligne a déjà changé ailleurs, la transaction annule les autres.
    if (count !== ligneIds.length) throw new ConflictError('Déjà modifié depuis un autre écran. La liste a été actualisée.')
    const lignes = await tx.ligneCommande.findMany({
      where: { id: { in: [...ligneIds] } },
      distinct: ['commandeId'],
      select: { commandeId: true },
    })
    return lignes.map((ligne) => ligne.commandeId)
  })

  diffuser(commandeIds, 'commande:statut')
  return commandesParIds(restaurantId, commandeIds, postes)
}

/** Après le début de la préparation, seule la cuisine annule (§6). Le motif est obligatoire, la base le vérifie aussi. */
export async function annulerLigne(
  restaurantId: number,
  utilisateurId: number,
  ligneId: number,
  motif: string,
  postes: readonly Poste[],
): Promise<CommandeCuisine> {
  const ligne = await prisma.ligneCommande.findFirst({
    where: { id: ligneId, commande: { restaurantId } },
    select: { commandeId: true },
  })
  if (!ligne) throw new NotFoundError('Article introuvable')
  await exigerMemePoste([ligneId], postes)

  const { count } = await prisma.ligneCommande.updateMany({
    where: { id: ligneId, statut: { in: STATUTS_EN_COURS } },
    data: { statut: 'ANNULEE', annuleeAt: new Date(), annuleeParId: utilisateurId, motifAnnulation: motif },
  })
  if (count === 0) throw new ConflictError('Article déjà servi ou annulé. La liste a été actualisée.')

  diffuser([ligne.commandeId], 'commande:annulee')
  const [commande] = await commandesParIds(restaurantId, [ligne.commandeId], postes)
  if (!commande) throw new NotFoundError('Commande introuvable')
  return commande
}

/** Bouton « urgent » (§10) : épingle les commandes en haut de l'écran. */
export async function marquerUrgent(
  restaurantId: number,
  commandeIds: readonly number[],
  urgent: boolean,
  postes: readonly Poste[],
): Promise<CommandeCuisine[]> {
  const { count } = await prisma.commande.updateMany({
    where: { id: { in: [...commandeIds] }, restaurantId },
    data: { urgent },
  })
  if (count !== commandeIds.length) throw new NotFoundError('Commande introuvable')

  diffuser(commandeIds, 'commande:statut')
  return commandesParIds(restaurantId, commandeIds, postes)
}
