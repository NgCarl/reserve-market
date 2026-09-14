import { rateLimit } from 'express-rate-limit'

// Filet de sécurité par IP, en plus de la suspension par compte (services/tentatives.service.ts) :
// empêche une même IP d'essayer des dizaines d'emails différents. 30 échecs sur 15 minutes, seuil
// assez haut pour tout le personnel du restaurant derrière la même box. Les connexions réussies
// ne comptent pas.
// https://express-rate-limit.mintlify.app/reference/configuration
export const limiteurConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion depuis cette adresse. Réessayez dans 15 minutes.' },
})
