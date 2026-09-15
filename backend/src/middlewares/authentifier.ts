import type { RequestHandler, Response } from 'express'
import type { Role } from '../generated/prisma/client.js'
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js'
import { NOM_COOKIE_SESSION, optionsCookieSession } from '../lib/session.js'
import { sessionDepuisJeton } from '../services/auth.service.js'
import type { UtilisateurPublic } from '../services/utilisateur.service.js'

export const authentifier: RequestHandler = async (req, res, next) => {
  const jeton: unknown = req.cookies?.[NOM_COOKIE_SESSION]
  if (typeof jeton !== 'string' || jeton === '') throw new UnauthorizedError()
  const { utilisateur, jetonRenouvele } = await sessionDepuisJeton(jeton)
  // Session glissante de l'admin : l'échéance d'inactivité repart, toujours dans un cookie de session du navigateur.
  if (jetonRenouvele) res.cookie(NOM_COOKIE_SESSION, jetonRenouvele, optionsCookieSession)
  res.locals.utilisateur = utilisateur
  next()
}

/** À placer après authentifier. */
export const exigerRole = (...roles: readonly Role[]): RequestHandler => (_req, res, next) => {
  if (!roles.includes(utilisateurConnecte(res).role)) throw new ForbiddenError()
  next()
}

/** Utilisateur posé par authentifier. Si une route a oublié ce middleware, on refuse (401) plutôt que d'ouvrir. */
export function utilisateurConnecte(res: Response): UtilisateurPublic {
  const utilisateur = res.locals.utilisateur
  if (!utilisateur) throw new UnauthorizedError()
  return utilisateur
}
