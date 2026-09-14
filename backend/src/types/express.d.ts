import type { UtilisateurPublic } from '../services/utilisateur.service.js'

declare global {
  namespace Express {
    interface Locals {
      /** Posé par le middleware authentifier. */
      utilisateur?: UtilisateurPublic
    }
  }
}
