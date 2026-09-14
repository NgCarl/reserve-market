import type { RequestHandler } from 'express'
import { DUREE_SESSION_MS, NOM_COOKIE_SESSION, optionsCookieSession } from '../lib/session.js'
import { utilisateurConnecte } from '../middlewares/authentifier.js'
import type { Connexion } from '../schemas/auth.schema.js'
import { connecter } from '../services/auth.service.js'

type Params = Record<string, string>

export const login: RequestHandler<Params, unknown, Connexion> = async (req, res) => {
  const { utilisateur, jeton } = await connecter(req.body.email, req.body.motDePasse, req.ip ?? 'inconnue')
  res.cookie(NOM_COOKIE_SESSION, jeton, { ...optionsCookieSession, maxAge: DUREE_SESSION_MS })
  res.json({ utilisateur })
}

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(NOM_COOKIE_SESSION, optionsCookieSession)
  res.status(204).end()
}

export const checkAuth: RequestHandler = (_req, res) => {
  res.json({ utilisateur: utilisateurConnecte(res) })
}
