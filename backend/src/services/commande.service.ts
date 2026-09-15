import { Prisma, type Poste } from '../generated/prisma/client.js'
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import type { NouvelleCommande } from '../schemas/commande.schema.js'
import { formaterCommande, selectCommandePublique, type CommandePublique } from './commande.format.js'
import { diffuser } from './diffusion.service.js'

/** Une commande reste consultable par le client pendant un service. */
const DUREE_SUIVI_MS = 12 * 60 * 60 * 1000

const MESSAGE_TABLE = 'Table introuvable : scannez à nouveau le QR code posé sur votre table'

interface LignePreparee {
  platId: number
  nomPlat: string
  prixUnitaire: number
  quantite: number
  poste: Poste
  note: string | null
  options: { libelle: string; prix: number }[]
  stockSuivi: boolean
}

/** Vérifie chaque choix contre la base et recalcule les prix : le client n'envoie jamais de montant. */
async function preparerLignes(restaurantId: number, donnees: NouvelleCommande): Promise<LignePreparee[]> {
  const plats = await prisma.plat.findMany({
    where: { id: { in: [...new Set(donnees.lignes.map((ligne) => ligne.platId))] }, restaurantId },
    select: {
      id: true,
      nom: true,
      prix: true,
      disponible: true,
      stock: true,
      archiveAt: true,
      categorie: { select: { poste: true, archiveAt: true } },
      groupesVariantes: {
        orderBy: { ordre: 'asc' },
        select: { nom: true, options: { select: { id: true, nom: true, supplement: true } } },
      },
      extras: { select: { id: true, nom: true, prix: true } },
    },
  })
  const parId = new Map(plats.map((plat) => [plat.id, plat]))

  const indisponibles = new Map<number, string>()
  const lignes: LignePreparee[] = []
  for (const ligne of donnees.lignes) {
    const plat = parId.get(ligne.platId)
    if (!plat) throw new ValidationError('Article introuvable : rechargez le menu')
    if (plat.archiveAt || plat.categorie.archiveAt || !plat.disponible || plat.stock === 0) {
      indisponibles.set(plat.id, plat.nom)
      continue
    }

    const choix: { libelle: string; prix: number }[] = []
    const optionsNonUtilisees = new Set(ligne.optionIds)
    // Choix unique obligatoire : exactement une option par groupe (taille, accompagnement, parfum…).
    for (const groupe of plat.groupesVariantes) {
      const retenues = groupe.options.filter((option) => optionsNonUtilisees.has(option.id))
      const option = retenues[0]
      if (retenues.length !== 1 || !option) throw new ValidationError(`${plat.nom} : choisissez une option « ${groupe.nom} »`)
      optionsNonUtilisees.delete(option.id)
      choix.push({ libelle: `${groupe.nom} : ${option.nom}`, prix: option.supplement })
    }
    if (optionsNonUtilisees.size > 0) throw new ValidationError(`${plat.nom} : option invalide, rechargez le menu`)

    for (const extraId of ligne.extraIds) {
      const extra = plat.extras.find((candidat) => candidat.id === extraId)
      if (!extra) throw new ValidationError(`${plat.nom} : extra invalide, rechargez le menu`)
      choix.push({ libelle: `Extra : ${extra.nom}`, prix: extra.prix })
    }

    lignes.push({
      platId: plat.id,
      nomPlat: plat.nom,
      prixUnitaire: plat.prix + choix.reduce((total, element) => total + element.prix, 0),
      quantite: ligne.quantite,
      poste: plat.categorie.poste,
      note: ligne.note === '' ? null : ligne.note,
      options: choix,
      stockSuivi: plat.stock !== null,
    })
  }

  if (indisponibles.size > 0) {
    throw new ConflictError(
      `Plus disponible : ${[...indisponibles.values()].join(', ')}. Retirez-le de votre panier.`,
      { indisponibles: [...indisponibles.keys()] },
    )
  }
  return lignes
}

/** Décrément atomique et conditionnel (CLAUDE.md §6) : jamais de lecture puis d'écriture. 0 ligne modifiée = stock insuffisant. */
async function decrementerStocks(tx: Prisma.TransactionClient, lignes: readonly LignePreparee[]): Promise<void> {
  const besoins = new Map<number, { nom: string; quantite: number }>()
  for (const ligne of lignes) {
    if (!ligne.stockSuivi) continue
    besoins.set(ligne.platId, { nom: ligne.nomPlat, quantite: (besoins.get(ligne.platId)?.quantite ?? 0) + ligne.quantite })
  }
  for (const [platId, { nom, quantite }] of besoins) {
    const { count } = await tx.plat.updateMany({
      where: { id: platId, stock: { gte: quantite } },
      data: { stock: { decrement: quantite } },
    })
    if (count === 0) {
      throw new ConflictError(`Stock insuffisant : ${nom}. Réduisez la quantité ou retirez-le du panier.`, { indisponibles: [platId] })
    }
  }
}

async function commandeExistante(cleIdempotence: string, tableId: number): Promise<CommandePublique | null> {
  const commande = await prisma.commande.findUnique({
    where: { cleIdempotence },
    select: { ...selectCommandePublique, tableId: true },
  })
  if (!commande) return null
  if (commande.tableId !== tableId) throw new ConflictError('Cette commande a déjà été envoyée depuis une autre table')
  return formaterCommande(commande)
}

export async function creerCommandeClient(
  jeton: string,
  donnees: NouvelleCommande,
): Promise<{ commande: CommandePublique; creee: boolean }> {
  const table = await prisma.table.findFirst({
    where: { jeton, actif: true },
    select: { id: true, restaurantId: true, nombreChaises: true },
  })
  if (!table) throw new NotFoundError(MESSAGE_TABLE)
  if (donnees.chaise > table.nombreChaises) {
    throw new ValidationError(`Place invalide : cette table compte ${table.nombreChaises} places`)
  }

  // Renvoi d'une commande déjà enregistrée (double appui, réseau lent) : on renvoie celle qui existe.
  const deja = await commandeExistante(donnees.cleIdempotence, table.id)
  if (deja) return { commande: deja, creee: false }

  const lignes = await preparerLignes(table.restaurantId, donnees)
  try {
    // Une commande = une transaction (§6) : stocks, commande et lignes, ou rien.
    const commande = await prisma.$transaction(
      async (tx) => {
        await decrementerStocks(tx, lignes)
        return tx.commande.create({
          data: {
            restaurantId: table.restaurantId,
            tableId: table.id,
            source: 'CLIENT',
            cleIdempotence: donnees.cleIdempotence,
            lignes: {
              create: lignes.map((ligne) => ({
                platId: ligne.platId,
                nomPlat: ligne.nomPlat,
                prixUnitaire: ligne.prixUnitaire,
                quantite: ligne.quantite,
                poste: ligne.poste,
                chaise: donnees.chaise,
                note: ligne.note,
                options: { create: ligne.options },
              })),
            },
          },
          select: selectCommandePublique,
        })
      },
      { timeout: 15_000 },
    )
    // Pas d'acceptation manuelle (§6) : la commande part aussitôt vers la cuisine, le bar et les serveurs.
    diffuser([commande.id], 'commande:nouvelle')
    return { commande: formaterCommande(commande), creee: true }
  } catch (error) {
    // Deux envois simultanés de la même commande : la contrainte UNIQUE a rejeté le second, stocks compris.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existante = await commandeExistante(donnees.cleIdempotence, table.id)
      if (existante) return { commande: existante, creee: false }
    }
    throw error
  }
}

export async function obtenirCommandeClient(jeton: string, commandeId: number): Promise<CommandePublique> {
  const commande = await prisma.commande.findFirst({
    where: {
      id: commandeId,
      // Portée limitée à la table du QR et au service en cours : pas de consultation des commandes d'hier.
      table: { jeton, actif: true },
      createdAt: { gte: new Date(Date.now() - DUREE_SUIVI_MS) },
    },
    select: selectCommandePublique,
  })
  if (!commande) throw new NotFoundError('Commande introuvable')
  return formaterCommande(commande)
}

/**
 * Commandes de la table pendant le service, tant qu'elles ne sont pas encaissées.
 * Retrouvées par le serveur et non par la mémoire du téléphone : elles restent accessibles après un
 * rechargement, un nouveau scan du QR ou depuis un autre téléphone de la même table.
 */
export async function listerCommandesTable(jeton: string): Promise<CommandePublique[]> {
  const table = await prisma.table.findFirst({ where: { jeton, actif: true }, select: { id: true } })
  if (!table) throw new NotFoundError(MESSAGE_TABLE)
  const commandes = await prisma.commande.findMany({
    where: { tableId: table.id, encaisseeAt: null, createdAt: { gte: new Date(Date.now() - DUREE_SUIVI_MS) } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: selectCommandePublique,
  })
  return commandes.map((commande) => formaterCommande(commande))
}
