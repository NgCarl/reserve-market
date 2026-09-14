import type { Prisma } from '../generated/prisma/client.js'
import { NotFoundError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import { urlPhoto, urlPhotoFloue, urlVignette } from './photo.service.js'

// Menu vu par le client après le scan du QR. Seuls les champs utiles à l'affichage : ni stock chiffré,
// ni temps de préparation, ni données internes.
const selectPlatPublic = {
  id: true,
  nom: true,
  description: true,
  prix: true,
  disponible: true,
  stock: true,
  imagePublicId: true,
  photoCredit: true,
  groupesVariantes: {
    orderBy: { ordre: 'asc' },
    select: {
      id: true,
      nom: true,
      affichage: true,
      options: { orderBy: { ordre: 'asc' }, select: { id: true, nom: true, supplement: true, imagePublicId: true } },
    },
  },
  extras: { orderBy: { ordre: 'asc' }, select: { id: true, nom: true, prix: true } },
  addons: {
    where: { platPropose: { archiveAt: null } },
    orderBy: { ordre: 'asc' },
    select: { platPropose: { select: { id: true, nom: true, prix: true, disponible: true, stock: true, imagePublicId: true } } },
  },
} as const satisfies Prisma.PlatSelect

// Épuisé : désactivé par le restaurant, ou stock suivi tombé à zéro.
const estDisponible = (plat: { disponible: boolean; stock: number | null }): boolean =>
  plat.disponible && plat.stock !== 0

export async function menuDeLaTable(jeton: string) {
  const table = await prisma.table.findFirst({
    where: { jeton, actif: true },
    select: { numero: true, nombreChaises: true, restaurant: { select: { id: true, nom: true } } },
  })
  if (!table) throw new NotFoundError('Table introuvable : scannez à nouveau le QR code posé sur votre table')

  const categories = await prisma.categorie.findMany({
    where: { restaurantId: table.restaurant.id, archiveAt: null, plats: { some: { archiveAt: null } } },
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      nom: true,
      poste: true,
      plats: { where: { archiveAt: null }, orderBy: [{ ordre: 'asc' }, { id: 'asc' }], select: selectPlatPublic },
    },
  })

  return {
    restaurant: { nom: table.restaurant.nom },
    table: { numero: table.numero, nombreChaises: table.nombreChaises },
    categories: categories.map((categorie) => ({
      id: categorie.id,
      nom: categorie.nom,
      // Vignette de la puce : photo du premier plat illustré de la catégorie.
      imageUrl: urlVignette(categorie.plats.find((plat) => plat.imagePublicId)?.imagePublicId ?? null),
      plats: categorie.plats.map(({ imagePublicId, stock, disponible, addons, groupesVariantes, ...plat }) => ({
        ...plat,
        groupesVariantes: groupesVariantes.map((groupe) => ({
          ...groupe,
          options: groupe.options.map(({ imagePublicId: imageOption, ...option }) => ({ ...option, photoUrl: urlVignette(imageOption, 160) })),
        })),
        // Bar ou cuisine : adapte l'exemple d'instruction dans la fiche (glaçons pour une boisson, cuisson pour un plat).
        poste: categorie.poste,
        disponible: estDisponible({ disponible, stock }),
        photoUrl: urlPhoto(imagePublicId),
        photoFloueUrl: urlPhotoFloue(imagePublicId),
        addons: addons.map(({ platPropose }) => ({
          id: platPropose.id,
          nom: platPropose.nom,
          prix: platPropose.prix,
          disponible: estDisponible(platPropose),
          photoUrl: urlVignette(platPropose.imagePublicId, 200),
        })),
      })),
    })),
  }
}

export type MenuTable = Awaited<ReturnType<typeof menuDeLaTable>>
