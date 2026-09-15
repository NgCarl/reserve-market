// Miroir des événements émis par backend/src/sockets/io.ts (CLAUDE.md §9).
import type { CommandeSuivie } from './commande'
import type { CommandeCuisine } from './cuisine'
import type { AppelSalle } from './salle'

export interface EvenementsPersonnel {
  'commande:nouvelle': (commande: CommandeCuisine) => void
  'commande:statut': (commande: CommandeCuisine) => void
  'commande:annulee': (commande: CommandeCuisine) => void
}

/** Téléphone du serveur : les commandes, plus les appels des tables. */
export interface EvenementsSalle extends EvenementsPersonnel {
  'table:appel-serveur': (appel: AppelSalle) => void
  'table:addition': (appel: AppelSalle) => void
  'appel:traite': (appel: { id: number }) => void
}

/** La table ne reçoit que les changements de ses propres commandes. */
export interface EvenementsTable {
  'commande:statut': (commande: CommandeSuivie) => void
  'commande:annulee': (commande: CommandeSuivie) => void
}
