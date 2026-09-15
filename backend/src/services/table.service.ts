import { renderSVG } from 'uqr'
import { Prisma } from '../generated/prisma/client.js'
import { ConflictError, NotFoundError } from '../lib/errors.js'
import { genererJetonTable } from '../lib/jeton.js'
import { prisma } from '../lib/prisma.js'
import type { ModificationTable, NouvelleTable } from '../schemas/table.schema.js'

/** Même fenêtre que le suivi client : une commande non encaissée de moins de 12 h compte comme en cours. */
const DUREE_SERVICE_MS = 12 * 60 * 60 * 1000

const selectRestaurant = { nom: true, telephone: true, adresse: true } as const satisfies Prisma.RestaurantSelect
const selectTable = { id: true, numero: true, nombreChaises: true, jeton: true } as const satisfies Prisma.TableSelect

type TableBrute = Prisma.TableGetPayload<{ select: typeof selectTable }>

/** Le jeton ne sort que sous forme d'adresse du menu, celle que le QR encode. */
function formaterTable(table: TableBrute, adresseSite: string) {
  return {
    id: table.id,
    numero: table.numero,
    nombreChaises: table.nombreChaises,
    urlMenu: `${adresseSite}/menu/${table.jeton}`,
  }
}

export type TableAdmin = ReturnType<typeof formaterTable>

const estDoublonNumero = (error: unknown): boolean =>
  // P2002 : contrainte d'unicité (restaurantId, numero).
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

function restaurantDe(restaurantId: number) {
  return prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: selectRestaurant })
}

async function tableActive(restaurantId: number, tableId: number): Promise<TableBrute> {
  const table = await prisma.table.findFirst({ where: { id: tableId, restaurantId, actif: true }, select: selectTable })
  if (!table) throw new NotFoundError('Table introuvable')
  return table
}

export async function listerTables(restaurantId: number, adresseSite: string) {
  const [restaurant, tables] = await Promise.all([
    restaurantDe(restaurantId),
    prisma.table.findMany({ where: { restaurantId, actif: true }, orderBy: { numero: 'asc' }, select: selectTable }),
  ])
  return { restaurant, tables: tables.map((table) => formaterTable(table, adresseSite)) }
}

export async function obtenirTable(restaurantId: number, tableId: number, adresseSite: string) {
  const [restaurant, table] = await Promise.all([restaurantDe(restaurantId), tableActive(restaurantId, tableId)])
  return { restaurant, table: formaterTable(table, adresseSite) }
}

export async function creerTable(restaurantId: number, donnees: NouvelleTable, adresseSite: string): Promise<TableAdmin> {
  const existante = await prisma.table.findUnique({
    where: { restaurantId_numero: { restaurantId, numero: donnees.numero } },
    select: { id: true, actif: true },
  })
  if (existante?.actif) throw new ConflictError(`La table ${donnees.numero} existe déjà`)

  try {
    const table = existante
      // Table supprimée puis recréée : elle est réactivée avec un nouveau jeton, l'ancien QR reste inutilisable.
      ? await prisma.table.update({
        where: { id: existante.id },
        data: { actif: true, nombreChaises: donnees.nombreChaises, jeton: genererJetonTable() },
        select: selectTable,
      })
      : await prisma.table.create({
        data: { restaurantId, numero: donnees.numero, nombreChaises: donnees.nombreChaises, jeton: genererJetonTable() },
        select: selectTable,
      })
    return formaterTable(table, adresseSite)
  } catch (error) {
    if (estDoublonNumero(error)) throw new ConflictError(`La table ${donnees.numero} existe déjà`)
    throw error
  }
}

export async function modifierTable(
  restaurantId: number,
  tableId: number,
  donnees: ModificationTable,
  adresseSite: string,
): Promise<TableAdmin> {
  try {
    const { count } = await prisma.table.updateMany({ where: { id: tableId, restaurantId, actif: true }, data: donnees })
    if (count === 0) throw new NotFoundError('Table introuvable')
  } catch (error) {
    if (estDoublonNumero(error)) {
      throw new ConflictError(`Le numéro ${donnees.numero ?? ''} est déjà pris par une autre table, active ou supprimée`)
    }
    throw error
  }
  return formaterTable(await tableActive(restaurantId, tableId), adresseSite)
}

/** Nouveau jeton : l'ancien QR cesse aussitôt de fonctionner (§6). À réimprimer ensuite. */
export async function regenererJeton(restaurantId: number, tableId: number, adresseSite: string): Promise<TableAdmin> {
  const { count } = await prisma.table.updateMany({
    where: { id: tableId, restaurantId, actif: true },
    data: { jeton: genererJetonTable() },
  })
  if (count === 0) throw new NotFoundError('Table introuvable')
  return formaterTable(await tableActive(restaurantId, tableId), adresseSite)
}

/**
 * Suppression douce, comme pour les plats : les commandes passées gardent leur table.
 * Le QR ne fonctionne plus (table inactive, jeton changé). Refusée tant que la table a des commandes non encaissées.
 */
export async function supprimerTable(restaurantId: number, tableId: number): Promise<void> {
  const enCours = await prisma.commande.count({
    where: { tableId, restaurantId, encaisseeAt: null, createdAt: { gte: new Date(Date.now() - DUREE_SERVICE_MS) } },
  })
  if (enCours > 0) {
    throw new ConflictError(`Cette table a ${enCours} commande${enCours > 1 ? 's' : ''} non encaissée${enCours > 1 ? 's' : ''} : suppression impossible pendant le service.`)
  }
  const { count } = await prisma.table.updateMany({
    where: { id: tableId, restaurantId, actif: true },
    data: { actif: false, jeton: genererJetonTable() },
  })
  if (count === 0) throw new NotFoundError('Table introuvable')
}

/** QR code en SVG : net à toutes les tailles d'impression. Correction d'erreur M pour résister à une fiche un peu abîmée. */
export async function qrCodeTable(restaurantId: number, tableId: number, adresseSite: string): Promise<string> {
  const table = await tableActive(restaurantId, tableId)
  return renderSVG(formaterTable(table, adresseSite).urlMenu, { ecc: 'M', border: 2, pixelSize: 10, blackColor: '#032842' })
}
