import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Le CLI Prisma (migrate, studio) passe par la connexion directe : les migrations
// ne passent pas par le pooler Neon. https://neon.com/docs/guides/prisma
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL_UNPOOLED'),
  },
})
