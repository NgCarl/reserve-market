import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import { z } from 'zod'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { hacherMotDePasse } from '../src/lib/password.js'
import { nouvelUtilisateurSchema } from '../src/schemas/utilisateur.schema.js'
import { carte, restaurantSeed, tablesSeed, type PlatSeed } from './data/carte.js'
import { descriptions } from './data/descriptions.js'
import { appliquerGarnitures, appliquerParfums } from './garnitures.js'

// Mêmes règles que la création d'un compte par l'API (email valide, mot de passe de 12 caractères minimum).
const configSeed = z
  .object({
    DATABASE_URL: z.string({ error: 'manquant : copier backend/.env.example en backend/.env' }).min(1),
    SEED_ADMIN_NOM: nouvelUtilisateurSchema.shape.nom,
    SEED_ADMIN_EMAIL: nouvelUtilisateurSchema.shape.email,
    SEED_ADMIN_MOT_DE_PASSE: nouvelUtilisateurSchema.shape.motDePasse,
  })
  .safeParse(process.env)

if (!configSeed.success) {
  console.error(`Configuration du seed invalide dans backend/.env :\n${z.prettifyError(configSeed.error)}`)
  process.exit(1)
}

const config = configSeed.data
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.DATABASE_URL }) })

// 128 bits d'aléa, encodés pour une URL : impossible à deviner (CLAUDE.md §6).
const genererJeton = (): string => randomBytes(16).toString('base64url')

// Le prix de base est celui de la plus petite taille ; les autres deviennent des suppléments.
function prixEtVariantes(plat: PlatSeed) {
  if ('prix' in plat) return { prix: plat.prix, groupesVariantes: undefined }

  const [base, ...autres] = plat.tailles
  if (autres.some((taille) => taille.prix < base.prix)) {
    throw new Error(`${plat.nom} : les tailles doivent être listées de la moins chère à la plus chère`)
  }
  return {
    prix: base.prix,
    groupesVariantes: {
      create: {
        nom: 'Taille',
        options: {
          create: plat.tailles.map((taille, ordre) => ({
            nom: taille.nom,
            supplement: taille.prix - base.prix,
            ordre,
          })),
        },
      },
    },
  }
}

async function creerCarte(): Promise<{ id: number }> {
  const restaurant = await prisma.$transaction(
    async (tx) => {
      const restaurant = await tx.restaurant.create({ data: restaurantSeed })

      await tx.table.createMany({
        data: Array.from({ length: tablesSeed.nombre }, (_, index) => ({
          restaurantId: restaurant.id,
          numero: index + 1,
          nombreChaises: tablesSeed.chaisesParTable,
          jeton: genererJeton(),
        })),
      })

      for (const [ordreCategorie, categorie] of carte.entries()) {
        await tx.categorie.create({
          data: {
            restaurant: { connect: { id: restaurant.id } },
            nom: categorie.nom,
            poste: categorie.poste,
            ordre: ordreCategorie,
            plats: {
              create: categorie.plats.map((plat, ordre) => ({
                restaurant: { connect: { id: restaurant.id } },
                nom: plat.nom,
                // Description imprimée sur la carte en priorité, sinon la description provisoire de démonstration.
                description: plat.description ?? descriptions[`${categorie.nom}|${plat.nom}`],
                ordre,
                ...prixEtVariantes(plat),
              })),
            },
          },
        })
      }
      return restaurant
    },
    { timeout: 60_000 },
  )

  const [categories, plats, tables] = await Promise.all([
    prisma.categorie.count(),
    prisma.plat.count(),
    prisma.table.count(),
  ])
  console.info(`Carte créée : ${categories} catégories, ${plats} plats, ${tables} tables.`)
  return restaurant
}

async function creerAdmin(restaurantId: number): Promise<void> {
  const existant = await prisma.utilisateur.findUnique({
    where: { email: config.SEED_ADMIN_EMAIL },
    select: { id: true },
  })
  if (existant) {
    console.info(`Admin ${config.SEED_ADMIN_EMAIL} déjà présent, inchangé.`)
    return
  }
  await prisma.utilisateur.create({
    data: {
      restaurantId,
      nom: config.SEED_ADMIN_NOM,
      email: config.SEED_ADMIN_EMAIL,
      role: 'ADMIN',
      motDePasseHash: await hacherMotDePasse(config.SEED_ADMIN_MOT_DE_PASSE),
    },
  })
  console.info(`Admin créé : ${config.SEED_ADMIN_EMAIL}`)
}

// Rejouable : la carte n'est créée que sur une base vide, l'admin seulement s'il n'existe pas.
async function main(): Promise<void> {
  const existant = await prisma.restaurant.findFirst({ select: { id: true } })
  if (existant) console.info('Carte déjà présente, inchangée.')
  const restaurant = existant ?? (await creerCarte())
  await creerAdmin(restaurant.id)
  const { accompagnements } = await appliquerGarnitures(prisma, restaurant.id)
  const { parfums } = await appliquerParfums(prisma, restaurant.id)
  console.info(`Démonstration : ${accompagnements} accompagnement(s), ${parfums} choix de parfum ajoutés.`)
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
