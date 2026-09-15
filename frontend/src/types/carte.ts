// Miroir des réponses de /api/categories et /api/plats (backend/src/services/categorie.service.ts, plat.service.ts).
import type { Poste } from './cuisine'

export interface CategorieAdmin {
  id: number
  nom: string
  poste: Poste
  ordre: number
  /** Nombre de plats actifs. */
  _count: { plats: number }
}

export type AffichageGroupe = 'TUILES' | 'LISTE'

export interface OptionAdmin {
  id: number
  nom: string
  supplement: number
  imagePublicId: string | null
  photoUrl: string | null
}

export interface GroupeAdmin {
  id: number
  nom: string
  affichage: AffichageGroupe
  options: OptionAdmin[]
}

export interface ExtraAdmin {
  id: number
  nom: string
  prix: number
}

export interface AddonAdmin {
  id: number
  nom: string
  prix: number
}

export interface PlatAdmin {
  id: number
  categorieId: number
  nom: string
  description: string | null
  prix: number
  disponible: boolean
  /** null : stock non suivi. */
  stock: number | null
  tempsPreparationMin: number | null
  ordre: number
  photo: { publicId: string; url: string | null } | null
  groupesVariantes: GroupeAdmin[]
  extras: ExtraAdmin[]
  addons: AddonAdmin[]
}
