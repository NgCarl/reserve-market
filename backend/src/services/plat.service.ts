import type { Prisma } from '../generated/prisma/client.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import type { ModificationPlat, NouveauPlat, PhotoPlat } from '../schemas/plat.schema.js'
import { photoAuthentique, supprimerPhoto, urlPhoto } from './photo.service.js'

const selectPlat = {
  id: true,
  categorieId: true,
  nom: true,
  description: true,
  prix: true,
  imagePublicId: true,
  disponible: true,
  stock: true,
  tempsPreparationMin: true,
  ordre: true,
  groupesVariantes: {
    orderBy: { ordre: 'asc' },
    select: { id: true, nom: true, options: { orderBy: { ordre: 'asc' }, select: { id: true, nom: true, supplement: true } } },
  },
  extras: { orderBy: { ordre: 'asc' }, select: { id: true, nom: true, prix: true } },
  addons: {
    where: { platPropose: { archiveAt: null } },
    orderBy: { ordre: 'asc' },
    select: { platPropose: { select: { id: true, nom: true, prix: true } } },
  },
} as const satisfies Prisma.PlatSelect

type PlatBrut = Prisma.PlatGetPayload<{ select: typeof selectPlat }>

function formater({ imagePublicId, addons, ...plat }: PlatBrut) {
  return {
    ...plat,
    photo: imagePublicId ? { publicId: imagePublicId, url: urlPhoto(imagePublicId) } : null,
    addons: addons.map((addon) => addon.platPropose),
  }
}

export type PlatDetaille = ReturnType<typeof formater>

// Les listes envoyées remplacent les listes existantes ; leur position donne l'ordre d'affichage.
const creationVariantes = (groupes: NonNullable<NouveauPlat['groupesVariantes']>) => ({
  create: groupes.map((groupe, ordre) => ({
    nom: groupe.nom,
    ordre,
    options: { create: groupe.options.map((option, ordreOption) => ({ ...option, ordre: ordreOption })) },
  })),
})
const creationExtras = (extras: NonNullable<NouveauPlat['extras']>) => ({
  create: extras.map((extra, ordre) => ({ ...extra, ordre })),
})
const creationAddons = (ids: readonly number[]) => ({
  create: ids.map((platProposeId, ordre) => ({ platProposeId, ordre })),
})

async function verifierCategorie(restaurantId: number, categorieId: number): Promise<void> {
  const trouvee = await prisma.categorie.count({ where: { id: categorieId, restaurantId, archiveAt: null } })
  if (trouvee === 0) throw new ValidationError('Catégorie introuvable ou archivée')
}

async function verifierAddons(restaurantId: number, ids: readonly number[], platId?: number): Promise<void> {
  if (platId !== undefined && ids.includes(platId)) throw new ValidationError('Un plat ne peut pas être son propre addon')
  if (ids.length === 0) return
  const trouves = await prisma.plat.count({ where: { id: { in: [...ids] }, restaurantId, archiveAt: null } })
  if (trouves !== ids.length) throw new ValidationError('Addon introuvable ou archivé')
}

async function platActif(restaurantId: number, id: number): Promise<{ imagePublicId: string | null }> {
  const plat = await prisma.plat.findFirst({ where: { id, restaurantId, archiveAt: null }, select: { imagePublicId: true } })
  if (!plat) throw new NotFoundError('Plat introuvable')
  return plat
}

export async function listerPlats(restaurantId: number): Promise<PlatDetaille[]> {
  const plats = await prisma.plat.findMany({
    where: { restaurantId, archiveAt: null, categorie: { archiveAt: null } },
    orderBy: [{ categorie: { ordre: 'asc' } }, { ordre: 'asc' }, { id: 'asc' }],
    select: selectPlat,
  })
  return plats.map(formater)
}

export async function obtenirPlat(restaurantId: number, id: number): Promise<PlatDetaille> {
  const plat = await prisma.plat.findFirst({ where: { id, restaurantId, archiveAt: null }, select: selectPlat })
  if (!plat) throw new NotFoundError('Plat introuvable')
  return formater(plat)
}

export async function creerPlat(restaurantId: number, donnees: NouveauPlat): Promise<PlatDetaille> {
  const { categorieId, groupesVariantes, extras, addonIds, ordre, ...champs } = donnees
  await verifierCategorie(restaurantId, categorieId)
  if (addonIds) await verifierAddons(restaurantId, addonIds)

  // Sans ordre précisé, le plat se place en dernier dans sa catégorie.
  const { _max } = await prisma.plat.aggregate({ where: { categorieId, archiveAt: null }, _max: { ordre: true } })
  const plat = await prisma.plat.create({
    data: {
      ...champs,
      ordre: ordre ?? (_max.ordre ?? -1) + 1,
      restaurant: { connect: { id: restaurantId } },
      categorie: { connect: { id: categorieId } },
      groupesVariantes: groupesVariantes && creationVariantes(groupesVariantes),
      extras: extras && creationExtras(extras),
      addons: addonIds && creationAddons(addonIds),
    },
    select: selectPlat,
  })
  return formater(plat)
}

export async function modifierPlat(restaurantId: number, id: number, donnees: ModificationPlat): Promise<PlatDetaille> {
  const { groupesVariantes, extras, addonIds, ...champs } = donnees
  await platActif(restaurantId, id)
  if (champs.categorieId !== undefined) await verifierCategorie(restaurantId, champs.categorieId)
  if (addonIds) await verifierAddons(restaurantId, addonIds, id)

  // Les commandes passées ne pointent pas vers les tailles ni les extras : elles en gardent une copie (§6).
  // On peut donc remplacer ces listes sans toucher aux additions existantes.
  const plat = await prisma.$transaction(async (tx) => {
    if (groupesVariantes) await tx.groupeVariante.deleteMany({ where: { platId: id } })
    if (extras) await tx.extra.deleteMany({ where: { platId: id } })
    if (addonIds) await tx.platAddon.deleteMany({ where: { platId: id } })
    return tx.plat.update({
      where: { id },
      data: {
        ...champs,
        groupesVariantes: groupesVariantes && creationVariantes(groupesVariantes),
        extras: extras && creationExtras(extras),
        addons: addonIds && creationAddons(addonIds),
      },
      select: selectPlat,
    })
  })
  return formater(plat)
}

/** Soft delete (CLAUDE.md §6) : le plat disparaît de la carte, les commandes passées le retrouvent. */
export async function archiverPlat(restaurantId: number, id: number): Promise<void> {
  const { count } = await prisma.plat.updateMany({
    where: { id, restaurantId, archiveAt: null },
    data: { archiveAt: new Date(), disponible: false },
  })
  if (count === 0) throw new NotFoundError('Plat introuvable')
}

export async function definirPhoto(restaurantId: number, id: number, photo: PhotoPlat): Promise<PlatDetaille> {
  if (!photoAuthentique(photo.publicId, photo.version, photo.signature)) {
    throw new ValidationError('Photo non reconnue : signature Cloudinary invalide')
  }
  const { imagePublicId: ancienne } = await platActif(restaurantId, id)
  const plat = await prisma.plat.update({ where: { id }, data: { imagePublicId: photo.publicId }, select: selectPlat })
  if (ancienne && ancienne !== photo.publicId) supprimerPhoto(ancienne)
  return formater(plat)
}

export async function retirerPhoto(restaurantId: number, id: number): Promise<PlatDetaille> {
  const { imagePublicId: ancienne } = await platActif(restaurantId, id)
  const plat = await prisma.plat.update({ where: { id }, data: { imagePublicId: null }, select: selectPlat })
  if (ancienne) supprimerPhoto(ancienne)
  return formater(plat)
}
