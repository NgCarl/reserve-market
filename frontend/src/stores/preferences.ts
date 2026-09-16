import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Liste : une colonne, photo à gauche. Grille : deux colonnes, photo en haut (comme FoodScan). */
export type Disposition = 'liste' | 'grille'

/** « auto » : photos masquées seulement si le téléphone annonce une connexion lente (CLAUDE.md §8). */
export type Photos = 'auto' | 'oui' | 'non'

interface Preferences {
  disposition: Disposition
  photos: Photos
  choisirDisposition: (disposition: Disposition) => void
  choisirPhotos: (photos: Photos) => void
}

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      disposition: 'liste',
      photos: 'auto',
      choisirDisposition: (disposition) => set({ disposition }),
      choisirPhotos: (photos) => set({ photos }),
    }),
    {
      name: 'reserve-market-preferences',
      partialize: ({ disposition, photos }) => ({ disposition, photos }),
      // Valeurs relues du stockage : vérifiées une à une, le contenu du navigateur n'est jamais une source sûre.
      merge: (persiste, courant) => {
        const enregistre = persiste as { disposition?: unknown; photos?: unknown } | undefined
        const { disposition, photos } = enregistre ?? {}
        return {
          ...courant,
          ...(disposition === 'liste' || disposition === 'grille' ? { disposition } : {}),
          ...(photos === 'auto' || photos === 'oui' || photos === 'non' ? { photos } : {}),
        }
      },
    },
  ),
)
