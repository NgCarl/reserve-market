// Miroir de backend/src/services/gestion.service.ts.
import type { StatutCommande } from './commande'
import type { Poste } from './cuisine'

export type SourceCommande = 'CLIENT' | 'SERVEUR'
export type ModePaiement = 'ESPECES' | 'ORANGE_MONEY' | 'MTN_MOMO' | 'CARTE'

/** Réglages du restaurant, dont les numéros marchands Mobile Money. */
export interface ReglagesRestaurant {
  nom: string
  telephone: string | null
  adresse: string | null
  numeroOrangeMoney: string | null
  numeroMtnMomo: string | null
}

export interface CommandeResume {
  id: number
  /** Date ISO d'envoi. */
  creeLe: string
  source: SourceCommande
  urgent: boolean
  table: { numero: number }
  statut: StatutCommande
  /** Hors articles annulés. */
  total: number
  articles: number
  places: number[]
  encaissee: boolean
}

export interface LigneAdmin {
  id: number
  nomPlat: string
  prixUnitaire: number
  quantite: number
  poste: Poste
  chaise: number | null
  note: string | null
  statut: StatutCommande
  options: { libelle: string; prix: number }[]
  preparationLe: string | null
  preteLe: string | null
  servieLe: string | null
  annuleeLe: string | null
  servieParNom: string | null
  annuleeParNom: string | null
  motifAnnulation: string | null
}

export interface CommandeAdmin {
  id: number
  creeLe: string
  source: SourceCommande
  urgent: boolean
  table: { numero: number }
  saisiePar: string | null
  statut: StatutCommande
  total: number
  articles: number
  places: number[]
  paiement: { mode: ModePaiement | null; encaisseeLe: string | null; encaisseePar: string | null }
  lignes: LigneAdmin[]
}

export interface TableauDeBord {
  /** Journée affichée, AAAA-MM-JJ à l'heure de Douala. */
  jour: string
  commandes: number
  chiffreAffaires: number
  totalEncaisse: number
  panierMoyen: number
  enCours: number
  platsPopulaires: { nomPlat: string; quantite: number; montant: number }[]
  dernieresCommandes: CommandeResume[]
}
