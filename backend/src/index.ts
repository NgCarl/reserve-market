// Toujours en premier : charge backend/.env avant que les autres modules lisent process.env.
import 'dotenv/config'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import express from 'express'
import morgan from 'morgan'
import { env } from './lib/env.js'
import { prisma } from './lib/prisma.js'
import { apiNotFound, errorHandler } from './middlewares/errorHandler.js'
import apiRoutes from './routes/index.js'

const app = express()

app.disable('x-powered-by')
// Nombre de proxys de confiance (Render : 1). Sans ce réglage, req.ip est l'IP du proxy et le
// limiteur de connexion compte tous les visiteurs comme un seul.
// https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', env.TRUST_PROXY_HOPS)

// Formats de log sans corps de requête : les mots de passe n'apparaissent jamais dans les logs.
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json())
app.use(cookieParser())

app.use('/api', apiRoutes)
// Avant le frontend : une route API inconnue répond 404 en JSON, et non avec la page du frontend.
app.use('/api', apiNotFound)

// Frontend buildé, copié dans backend/dist par npm run build:ui.
const dist = path.resolve(import.meta.dirname, '../dist')
app.use(express.static(dist))
// React Router : une adresse ouverte directement, comme /menu/:jeton après le scan du QR, renvoie index.html.
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'))
})

app.use(errorHandler)

const serveur = app.listen(env.PORT, (error) => {
  if (error) throw error
  console.info(`API Reserve Market : http://localhost:${env.PORT}/api`)
})

// Render envoie SIGTERM avant d'arrêter l'instance : on termine les requêtes en cours proprement.
const arreter = (signal: NodeJS.Signals) => {
  console.info(`${signal} reçu, arrêt du serveur`)
  serveur.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0))
  })
}
process.once('SIGTERM', arreter)
process.once('SIGINT', arreter)
