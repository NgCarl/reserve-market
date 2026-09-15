// Miroir de backend/src/services/salle.service.ts, appel.service.ts et menu.service.ts (menuServeur).
import type { StatutCommande } from './commande'
import type { Poste } from './cuisine'
import type { ModePaiement } from './gestion'
import type { CategorieMenu } from './menu'

export type TypeAppel = 'APPEL_SERVEUR' | 'ADDITION'

export interface TableServeur {
  id: number
  numero: number
  nombreChaises: number
}

export interface AppelSalle {
  id: number
  type: TypeAppel
  modePaiement: ModePaiement | null
  /** Date ISO de l'appel. */
  creeLe: string
  table: { id: number; numero: number }
  /** Addition : montant à régler. */
  montant: number | null
}

export interface LigneSalle {
  id: number
  commandeId: number
  creeLe: string
  nomPlat: string
  quantite: number
  prixUnitaire: number
  chaise: number | null
  note: string | null
  statut: StatutCommande
  poste: Poste
  options: string[]
}

export interface TableSalle {
  table: TableServeur
  /** Montant non encaissé, hors articles annulés. */
  total: number
  commandeIds: number[]
  aServir: LigneSalle[]
  enCours: LigneSalle[]
  servies: LigneSalle[]
  appels: AppelSalle[]
}

export interface EtatSalle {
  appels: AppelSalle[]
  tables: TableSalle[]
  toutesLesTables: TableServeur[]
}

export interface MenuServeur {
  restaurant: { nom: string }
  tables: TableServeur[]
  categories: CategorieMenu[]
}
