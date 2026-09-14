import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Liste : une colonne, photo à gauche. Grille : deux colonnes, photo en haut (comme FoodScan). */
export type Disposition = 'liste' | 'grille'

interface Preferences {
  disposition: Disposition
  choisirDisposition: (disposition: Disposition) => void
}

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      disposition: 'liste',
      choisirDisposition: (disposition) => set({ disposition }),
    }),
    {
      name: 'reserve-market-preferences',
      partialize: ({ disposition }) => ({ disposition }),
      merge: (persiste, courant) => {
        const disposition = (persiste as { disposition?: unknown } | undefined)?.disposition
        return disposition === 'liste' || disposition === 'grille' ? { ...courant, disposition } : courant
      },
    },
  ),
)
