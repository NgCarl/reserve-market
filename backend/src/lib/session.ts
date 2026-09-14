import type { CookieOptions } from 'express'
import { env } from './env.js'

/** Un service complet : le personnel ne se reconnecte pas en plein rush. */
export const DUREE_SESSION_MS = 12 * 60 * 60 * 1000

export const NOM_COOKIE_SESSION = 'session'

// httpOnly : le jeton est illisible depuis le JavaScript de la page (protège du vol par XSS).
// sameSite strict : le navigateur n'envoie jamais le cookie depuis un autre site (protège du CSRF).
// res.clearCookie exige ces mêmes options (hors maxAge et expires), sinon le navigateur garde le cookie.
// https://expressjs.com/en/5x/api/response/
export const optionsCookieSession: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
}
