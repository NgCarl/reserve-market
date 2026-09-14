import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Une commande reste consultable pendant un service (même durée que côté serveur). */
const DUREE_SUIVI_MS = 12 * 60 * 60 * 1000

interface CommandeMemorisee {
  id: number
  envoyeeLe: number
}

interface EtatCommandes {
  /** Commandes envoyées depuis ce téléphone, par jeton de table, la plus récente en premier. */
  parTable: Record<string, CommandeMemorisee[]>
  memoriser: (jeton: string, id: number) => void
}

function nettoyer(parTable: unknown): Record<string, CommandeMemorisee[]> {
  if (typeof parTable !== 'object' || parTable === null) return {}
  const limite = Date.now() - DUREE_SUIVI_MS
  const resultat: Record<string, CommandeMemorisee[]> = {}
  for (const [jeton, liste] of Object.entries(parTable)) {
    if (!Array.isArray(liste)) continue
    const valides = liste.filter(
      (c): c is CommandeMemorisee => Number.isInteger(c?.id) && typeof c?.envoyeeLe === 'number' && c.envoyeeLe > limite,
    )
    if (valides.length > 0) resultat[jeton] = valides
  }
  return resultat
}

export const useCommandes = create<EtatCommandes>()(
  persist(
    (set) => ({
      parTable: {},
      memoriser: (jeton, id) => set((etat) => ({
        parTable: {
          ...etat.parTable,
          [jeton]: [{ id, envoyeeLe: Date.now() }, ...(etat.parTable[jeton] ?? []).filter((c) => c.id !== id)].slice(0, 10),
        },
      })),
    }),
    {
      name: 'reserve-market-commandes',
      partialize: ({ parTable }) => ({ parTable }),
      // Au rechargement : on ne garde que les commandes encore consultables et bien formées.
      merge: (persiste, courant) => ({ ...courant, parTable: nettoyer((persiste as { parTable?: unknown } | undefined)?.parTable) }),
    },
  ),
)
