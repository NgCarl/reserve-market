import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { carte, restaurantSeed, tablesSeed, type PlatSeed } from './data/carte.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL manquant : copier backend/.env.example en backend/.env')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

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

async function main(): Promise<void> {
  if ((await prisma.restaurant.count()) > 0) {
    console.info('Base déjà initialisée, seed ignoré. Pour repartir de zéro : npm run db:reset puis npm run db:seed')
    return
  }

  await prisma.$transaction(
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
                description: plat.description,
                ordre,
                ...prixEtVariantes(plat),
              })),
            },
          },
        })
      }
    },
    { timeout: 60_000 },
  )

  const [categories, plats, tables] = await Promise.all([
    prisma.categorie.count(),
    prisma.plat.count(),
    prisma.table.count(),
  ])
  console.info(`Seed terminé : ${categories} catégories, ${plats} plats, ${tables} tables.`)
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
