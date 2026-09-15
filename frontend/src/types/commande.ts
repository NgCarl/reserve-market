// Miroir des réponses de POST /api/menu/:jeton/commandes et GET /api/menu/:jeton/commandes/:id
// (backend/src/services/commande.service.ts).

export type StatutCommande = 'RECUE' | 'EN_PREPARATION' | 'PRETE' | 'SERVIE' | 'ANNULEE'

export interface LigneSuivie {
  id: number
  nomPlat: string
  quantite: number
  prixUnitaire: number
  note: string | null
  statut: StatutCommande
  options: string[]
}

export interface CommandeSuivie {
  id: number
  /** Date ISO de création. */
  creeLe: string
  table: { numero: number }
  chaise: number | null
  /** Posé par le serveur après réception de l'argent. */
  encaissee: boolean
  statut: StatutCommande
  total: number
  lignes: LigneSuivie[]
}
