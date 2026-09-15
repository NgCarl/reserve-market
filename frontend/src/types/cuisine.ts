// Miroir de formaterCommandeCuisine (backend/src/services/commande.format.ts).
import type { StatutCommande } from './commande'

export type Poste = 'BAR' | 'CUISINE'

export interface LigneCuisine {
  id: number
  nomPlat: string
  quantite: number
  poste: Poste
  chaise: number | null
  note: string | null
  statut: StatutCommande
  options: string[]
  /** Dates ISO. */
  preparationLe: string | null
  preteLe: string | null
  motifAnnulation: string | null
}

export interface CommandeCuisine {
  id: number
  /** Date ISO d'envoi. */
  creeLe: string
  urgent: boolean
  table: { id: number; numero: number }
  lignes: LigneCuisine[]
}
