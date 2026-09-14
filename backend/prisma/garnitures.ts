import type { PrismaClient } from '../src/generated/prisma/client.js'

// Données de démonstration, rejouables : accompagnement au choix sur les plats servis avec garniture.
// PROVISOIRE, à faire confirmer par le restaurant : accompagnement compris dans le prix (supplément 0)
// et liste des plats concernés.

const ACCOMPAGNEMENT = {
  nom: 'Accompagnement',
  options: ['Frites de plantain', 'Frites de pommes de terre', 'Riz blanc', 'Miondo'],
}

/** [catégorie, nom du plat] ; « * » = tous les plats de la catégorie. */
const PLATS_AVEC_ACCOMPAGNEMENT: readonly (readonly [string, string])[] = [
  ['Grillades', '*'],
  ['Fast-food & pizza', 'Poulet pané'],
  ['Plats', 'Côte de porc'],
]

/** Parfum au choix sur les glaces personnalisables. Les photos des options s'ajoutent ensuite (back-office). */
const PARFUM = { nom: 'Parfum', options: ['Vanille', 'Chocolat'] }
const GLACES_AVEC_PARFUM: readonly (readonly [string, string])[] = [
  ['Ice cream', 'Ice cream only'],
  ['Ice cream', 'Ice cream + 2 toppings'],
]

export async function appliquerParfums(prisma: PrismaClient, restaurantId: number): Promise<{ parfums: number }> {
  const glaces = await prisma.plat.findMany({
    where: { restaurantId, archiveAt: null, OR: GLACES_AVEC_PARFUM.map(([categorie, nom]) => ({ nom, categorie: { nom: categorie } })) },
    select: { id: true, groupesVariantes: { select: { nom: true } } },
  })
  let parfums = 0
  for (const glace of glaces) {
    if (glace.groupesVariantes.some((groupe) => groupe.nom === PARFUM.nom)) continue
    await prisma.groupeVariante.create({
      data: {
        platId: glace.id,
        nom: PARFUM.nom,
        affichage: 'TUILES',
        ordre: glace.groupesVariantes.length,
        options: { create: PARFUM.options.map((nom, ordre) => ({ nom, ordre, supplement: 0 })) },
      },
    })
    parfums += 1
  }
  return { parfums }
}

export async function appliquerGarnitures(prisma: PrismaClient, restaurantId: number): Promise<{ accompagnements: number }> {
  const plats = await prisma.plat.findMany({
    where: {
      restaurantId,
      archiveAt: null,
      OR: PLATS_AVEC_ACCOMPAGNEMENT.map(([categorie, nom]) =>
        nom === '*' ? { categorie: { nom: categorie } } : { nom, categorie: { nom: categorie } },
      ),
    },
    select: { id: true, groupesVariantes: { select: { nom: true } } },
  })

  let accompagnements = 0
  for (const plat of plats) {
    if (plat.groupesVariantes.some((groupe) => groupe.nom === ACCOMPAGNEMENT.nom)) continue
    await prisma.groupeVariante.create({
      data: {
        platId: plat.id,
        nom: ACCOMPAGNEMENT.nom,
        affichage: 'LISTE',
        ordre: plat.groupesVariantes.length,
        options: { create: ACCOMPAGNEMENT.options.map((nom, ordre) => ({ nom, ordre, supplement: 0 })) },
      },
    })
    accompagnements += 1
  }
  return { accompagnements }
}
