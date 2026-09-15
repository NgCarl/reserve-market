import type { CookieOptions } from 'express'
import { env } from './env.js'

/** Cuisine et serveurs : un service complet, personne ne se reconnecte en plein rush. */
export const DUREE_SESSION_MS = 12 * 60 * 60 * 1000

/** Admin, souvent sur un poste partagé : déconnecté après 30 minutes sans activité (décision du 2026-09-15). */
export const DUREE_INACTIVITE_ADMIN_MS = 30 * 60 * 1000

/** Le jeton de l'admin n'est ré-signé qu'une fois par minute au plus, pas à chaque requête. */
export const RENOUVELLEMENT_SESSION_MS = 60 * 1000

export const NOM_COOKIE_SESSION = 'session'

// httpOnly : le jeton est illisible depuis le JavaScript de la page (protège du vol par XSS).
// sameSite strict : le navigateur n'envoie jamais le cookie depuis un autre site (protège du CSRF).
// Ni maxAge ni expires : cookie de session du navigateur, effacé à sa fermeture. Le jeton porte sa propre expiration.
// res.clearCookie exige ces mêmes options, sinon le navigateur garde le cookie.
// https://expressjs.com/en/5x/api/response/
export const optionsCookieSession: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
}
