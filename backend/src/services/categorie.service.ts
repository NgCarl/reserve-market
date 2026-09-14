import type { Prisma } from '../generated/prisma/client.js'
import { ConflictError, NotFoundError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import type { ModificationCategorie, NouvelleCategorie } from '../schemas/categorie.schema.js'

const selectCategorie = {
  id: true,
  nom: true,
  poste: true,
  ordre: true,
  _count: { select: { plats: { where: { archiveAt: null } } } },
} as const satisfies Prisma.CategorieSelect

export function listerCategories(restaurantId: number) {
  return prisma.categorie.findMany({
    where: { restaurantId, archiveAt: null },
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: selectCategorie,
  })
}

export async function creerCategorie(restaurantId: number, donnees: NouvelleCategorie) {
  // Sans ordre précisé, la nouvelle catégorie se place en dernier.
  const { _max } = await prisma.categorie.aggregate({ where: { restaurantId, archiveAt: null }, _max: { ordre: true } })
  return prisma.categorie.create({
    data: { restaurantId, nom: donnees.nom, poste: donnees.poste, ordre: donnees.ordre ?? (_max.ordre ?? -1) + 1 },
    select: selectCategorie,
  })
}

export async function modifierCategorie(restaurantId: number, id: number, donnees: ModificationCategorie) {
  const { count } = await prisma.categorie.updateMany({ where: { id, restaurantId, archiveAt: null }, data: donnees })
  if (count === 0) throw new NotFoundError('Catégorie introuvable')
  return prisma.categorie.findUniqueOrThrow({ where: { id }, select: selectCategorie })
}

/** Soft delete (CLAUDE.md §6). Refusé tant que la catégorie contient des plats actifs. */
export async function archiverCategorie(restaurantId: number, id: number): Promise<void> {
  const platsActifs = await prisma.plat.count({ where: { categorieId: id, restaurantId, archiveAt: null } })
  if (platsActifs > 0) {
    const plats = platsActifs > 1 ? `ses ${platsActifs} plats` : 'son plat'
    throw new ConflictError(`Catégorie non vide : archivez ou déplacez d'abord ${plats}`)
  }
  const { count } = await prisma.categorie.updateMany({
    where: { id, restaurantId, archiveAt: null },
    data: { archiveAt: new Date() },
  })
  if (count === 0) throw new NotFoundError('Catégorie introuvable')
}
