import type { StatutCommande } from '@/types/commande'
import type { CommandeCuisine, LigneCuisine, Poste } from '@/types/cuisine'
import { normaliser } from './texte'

export type StatutCarte = 'RECUE' | 'EN_PREPARATION' | 'PRETE'
export type Filtre = 'TOUTES' | StatutCarte
export type NiveauAttente = 'normal' | 'attention' | 'retard'

export interface LigneCarte extends LigneCuisine {
  commandeId: number
}

/** Les lignes d'une même table et d'un même poste, réunies pour sortir ensemble (CLAUDE.md §10). */
export interface CarteTable {
  cle: string
  poste: Poste
  table: { id: number; numero: number }
  /** Carte des lignes prêtes, en attente du serveur. */
  prete: boolean
  statut: StatutCarte
  urgent: boolean
  commandeIds: number[]
  /** Envoi de la plus ancienne commande de la carte (ISO) : base du code couleur d'attente. */
  depuis: string
  /** Dernière ligne passée prête (ISO). */
  preteLe: string | null
  lignes: LigneCarte[]
}

export interface ArticleAPreparer {
  cle: string
  poste: Poste
  nomPlat: string
  options: string[]
  note: string | null
  quantite: number
}

const estEnCours = (statut: StatutCommande): statut is StatutCarte =>
  statut === 'RECUE' || statut === 'EN_PREPARATION' || statut === 'PRETE'

/** Remplace les commandes reçues (réponse d'une action ou événement temps réel) et retire celles qui n'ont plus rien en cours. */
export function fusionnerCommandes(liste: readonly CommandeCuisine[], misesAJour: readonly CommandeCuisine[]): CommandeCuisine[] {
  const parId = new Map(liste.map((commande) => [commande.id, commande]))
  for (const commande of misesAJour) parId.set(commande.id, commande)
  return [...parId.values()]
    .filter((commande) => commande.lignes.some((ligne) => estEnCours(ligne.statut)))
    .sort((a, b) => a.creeLe.localeCompare(b.creeLe))
}

function comparerCartes(a: CarteTable, b: CarteTable): number {
  // Cartes en cours avant les cartes prêtes, urgentes en tête, puis la plus ancienne d'abord (§10).
  if (a.prete !== b.prete) return a.prete ? 1 : -1
  if (a.prete) return (a.preteLe ?? '').localeCompare(b.preteLe ?? '')
  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
  return a.depuis.localeCompare(b.depuis)
}

export function construireCartes(commandes: readonly CommandeCuisine[]): CarteTable[] {
  const cartes = new Map<string, CarteTable>()
  for (const commande of commandes) {
    for (const ligne of commande.lignes) {
      if (!estEnCours(ligne.statut)) continue
      const prete = ligne.statut === 'PRETE'
      const cle = `${ligne.poste}-${commande.table.id}-${prete ? 'prete' : 'en-cours'}`
      const carte: CarteTable = cartes.get(cle) ?? {
        cle,
        poste: ligne.poste,
        table: commande.table,
        prete,
        statut: 'RECUE',
        urgent: false,
        commandeIds: [],
        depuis: commande.creeLe,
        preteLe: null,
        lignes: [],
      }
      cartes.set(cle, carte)
      carte.lignes.push({ ...ligne, commandeId: commande.id })
      if (!carte.commandeIds.includes(commande.id)) carte.commandeIds.push(commande.id)
      if (commande.urgent) carte.urgent = true
      if (commande.creeLe < carte.depuis) carte.depuis = commande.creeLe
      if (ligne.preteLe && (carte.preteLe === null || ligne.preteLe > carte.preteLe)) carte.preteLe = ligne.preteLe
    }
  }

  const liste = [...cartes.values()]
  for (const carte of liste) {
    if (carte.prete) carte.statut = 'PRETE'
    else carte.statut = carte.lignes.every((ligne) => ligne.statut === 'RECUE') ? 'RECUE' : 'EN_PREPARATION'
  }
  return liste.sort(comparerCartes)
}

export function filtrerCartes(cartes: readonly CarteTable[], filtre: Filtre, recherche: string): CarteTable[] {
  // « 12 », « #12 » ou « table 3 » : numéro de commande ou de table ; sinon, nom d'un plat.
  const terme = normaliser(recherche).replace(/^(#|table\s*)/, '')
  return cartes.filter((carte) => {
    if (filtre === 'PRETE' && !carte.prete) return false
    if ((filtre === 'RECUE' || filtre === 'EN_PREPARATION') && !carte.lignes.some((ligne) => ligne.statut === filtre)) return false
    if (!terme) return true
    return String(carte.table.numero) === terme
      || carte.commandeIds.some((id) => String(id) === terme)
      || carte.lignes.some((ligne) => normaliser(ligne.nomPlat).includes(terme))
  })
}

/** Tableau des articles : quantités cumulées de ce qui reste à préparer, plat par plat. */
export function cumulerArticles(commandes: readonly CommandeCuisine[]): ArticleAPreparer[] {
  const articles = new Map<string, ArticleAPreparer>()
  for (const commande of commandes) {
    for (const ligne of commande.lignes) {
      if (ligne.statut !== 'RECUE' && ligne.statut !== 'EN_PREPARATION') continue
      const cle = [ligne.poste, ligne.nomPlat, ...ligne.options, ligne.note ?? ''].join('|')
      const article = articles.get(cle)
      if (article) article.quantite += ligne.quantite
      else articles.set(cle, { cle, poste: ligne.poste, nomPlat: ligne.nomPlat, options: ligne.options, note: ligne.note, quantite: ligne.quantite })
    }
  }
  return [...articles.values()].sort((a, b) => b.quantite - a.quantite || a.nomPlat.localeCompare(b.nomPlat, 'fr'))
}

export const minutesEcoulees = (depuis: string, maintenant: number): number =>
  Math.max(0, Math.floor((maintenant - Date.parse(depuis)) / 60_000))

/** Vert avant 10 minutes, orange jusqu'à 20, rouge au-delà (§10). */
export const niveauAttente = (minutes: number): NiveauAttente =>
  minutes < 10 ? 'normal' : minutes < 20 ? 'attention' : 'retard'
