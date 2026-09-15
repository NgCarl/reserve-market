// Les variables de backend/.env sont chargées par dotenv en première ligne de src/index.ts.
import { z } from 'zod'

const schemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, { error: 'URL postgresql:// attendue' }),
  JWT_SECRET: z.string().min(32, { error: 'au moins 32 caractères' }),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, { error: 'requis (tableau de bord Cloudinary)' }),
  CLOUDINARY_API_KEY: z.string().min(1, { error: 'requis (tableau de bord Cloudinary)' }),
  CLOUDINARY_API_SECRET: z.string().min(1, { error: 'requis (tableau de bord Cloudinary)' }),
  // Adresse encodée dans les QR des tables. Vide en local : on prend l'adresse par laquelle l'admin ouvre le site.
  URL_PUBLIQUE: z.preprocess(
    (valeur) => (valeur === '' ? undefined : valeur),
    z
      .url({ error: 'URL complète attendue, par exemple https://reserve-market.onrender.com' })
      .transform((url) => url.replace(/\/+$/, ''))
      .optional(),
  ),
})

const resultat = schemaEnv.safeParse(process.env)

// Mieux vaut refuser de démarrer que tourner avec une configuration incomplète.
if (!resultat.success) {
  console.error(`Configuration invalide dans backend/.env :\n${z.prettifyError(resultat.error)}`)
  process.exit(1)
}

export const env = resultat.data
