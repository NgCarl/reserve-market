// Miroir des événements émis par backend/src/sockets/io.ts (CLAUDE.md §9).
import type { CommandeSuivie } from './commande'
import type { CommandeCuisine } from './cuisine'

export interface EvenementsPersonnel {
  'commande:nouvelle': (commande: CommandeCuisine) => void
  'commande:statut': (commande: CommandeCuisine) => void
  'commande:annulee': (commande: CommandeCuisine) => void
}

/** La table ne reçoit que les changements de ses propres commandes. */
export interface EvenementsTable {
  'commande:statut': (commande: CommandeSuivie) => void
  'commande:annulee': (commande: CommandeSuivie) => void
}
