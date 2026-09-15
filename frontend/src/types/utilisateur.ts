// Miroir de UtilisateurPublic et de la vue du personnel (backend/src/services/utilisateur.service.ts).

export type Role = 'ADMIN' | 'CUISINE' | 'SERVEUR'

export interface Utilisateur {
  id: number
  restaurantId: number
  nom: string
  email: string
  role: Role
}

export interface Personnel extends Utilisateur {
  actif: boolean
  /** Date ISO d'inscription. */
  createdAt: string
}
