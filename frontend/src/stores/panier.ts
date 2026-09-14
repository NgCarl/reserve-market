import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { genererUuid } from '@/lib/uuid'

export interface ChoixLigne {
  /** Par exemple « Taille : 1/2 » ou « Extra : Piment ». */
  libelle: string
  prix: number
}

export interface LignePanier {
  /** Même plat, mêmes choix, même note : même clé, et les quantités s'additionnent. */
  cle: string
  platId: number
  nom: string
  optionIds: number[]
  extraIds: number[]
  choix: ChoixLigne[]
  note: string
  /** Miniature affichée dans le panier. */
  photoUrl: string | null
  /** Pour l'affichage seulement : le serveur recalcule tous les prix à la commande. */
  prixUnitaire: number
  quantite: number
}

export type NouvelleLigne = Omit<LignePanier, 'cle'>

interface EtatPanier {
  jeton: string | null
  /** UUID envoyé avec la commande : un double envoi est rejeté par la base (CLAUDE.md §6). */
  cleIdempotence: string
  lignes: LignePanier[]
  ouvrirPourTable: (jeton: string) => void
  ajouter: (ligne: NouvelleLigne) => void
  changerQuantite: (cle: string, quantite: number) => void
  vider: () => void
}

const QUANTITE_MAX = 99

const cleDeLigne = (ligne: NouvelleLigne): string =>
  [
    ligne.platId,
    [...ligne.optionIds].sort((a, b) => a - b).join(','),
    [...ligne.extraIds].sort((a, b) => a - b).join(','),
    ligne.note.trim(),
  ].join('|')

// Le stockage local peut contenir un panier d'une ancienne version ou modifié à la main :
// on ne le reprend que s'il a la forme attendue (avertissement de la doc du middleware persist).
function estLigneValide(valeur: unknown): valeur is LignePanier {
  if (typeof valeur !== 'object' || valeur === null) return false
  const ligne = valeur as Record<string, unknown>
  return typeof ligne.cle === 'string'
    && Number.isInteger(ligne.platId)
    && typeof ligne.nom === 'string'
    && Array.isArray(ligne.optionIds)
    && Array.isArray(ligne.extraIds)
    && Array.isArray(ligne.choix)
    && typeof ligne.note === 'string'
    && (ligne.photoUrl === null || typeof ligne.photoUrl === 'string')
    && Number.isInteger(ligne.prixUnitaire)
    && Number.isInteger(ligne.quantite)
}

interface PanierPersiste {
  jeton: string | null
  cleIdempotence: string
  lignes: LignePanier[]
}

function estPanierValide(valeur: unknown): valeur is PanierPersiste {
  if (typeof valeur !== 'object' || valeur === null) return false
  const panier = valeur as Record<string, unknown>
  return (panier.jeton === null || typeof panier.jeton === 'string')
    && typeof panier.cleIdempotence === 'string'
    && Array.isArray(panier.lignes)
    && panier.lignes.every(estLigneValide)
}

export const usePanier = create<EtatPanier>()(
  persist(
    (set) => ({
      jeton: null,
      cleIdempotence: genererUuid(),
      lignes: [],

      // Un panier appartient à une table : scanner le QR d'une autre table repart d'un panier vide.
      ouvrirPourTable: (jeton) => set((etat) => (etat.jeton === jeton ? etat : { jeton, lignes: [], cleIdempotence: genererUuid() })),

      ajouter: (nouvelle) => set((etat) => {
        const cle = cleDeLigne(nouvelle)
        const existante = etat.lignes.find((ligne) => ligne.cle === cle)
        if (!existante) return { lignes: [...etat.lignes, { ...nouvelle, cle }] }
        return {
          lignes: etat.lignes.map((ligne) =>
            ligne.cle === cle ? { ...ligne, quantite: Math.min(QUANTITE_MAX, ligne.quantite + nouvelle.quantite) } : ligne,
          ),
        }
      }),

      changerQuantite: (cle, quantite) => set((etat) => ({
        lignes: quantite <= 0
          ? etat.lignes.filter((ligne) => ligne.cle !== cle)
          : etat.lignes.map((ligne) => (ligne.cle === cle ? { ...ligne, quantite: Math.min(QUANTITE_MAX, quantite) } : ligne)),
      })),

      // Après une commande envoyée : nouvelle clé d'idempotence, sinon la commande suivante serait rejetée.
      vider: () => set({ lignes: [], cleIdempotence: genererUuid() }),
    }),
    {
      name: 'reserve-market-panier',
      // Version 2 : ajout de photoUrl. Un panier de version 1 ne passe pas la vérification et repart vide.
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ jeton, cleIdempotence, lignes }): PanierPersiste => ({ jeton, cleIdempotence, lignes }),
      merge: (persiste, courant) => (estPanierValide(persiste) ? { ...courant, ...persiste } : courant),
    },
  ),
)

export const totalPanier = (lignes: readonly LignePanier[]): number =>
  lignes.reduce((total, ligne) => total + ligne.prixUnitaire * ligne.quantite, 0)

export const nombreArticles = (lignes: readonly LignePanier[]): number =>
  lignes.reduce((total, ligne) => total + ligne.quantite, 0)
