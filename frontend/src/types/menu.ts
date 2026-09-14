// Miroir de la réponse de GET /api/menu/:jeton (backend/src/services/menu.service.ts).

export interface OptionVariante {
  id: number
  nom: string
  supplement: number
  /** Photo de l'option, affichée dans sa tuile (parfum vanille, chocolat…). */
  photoUrl: string | null
}

export interface GroupeVariante {
  id: number
  nom: string
  /** TUILES : tuiles défilantes (tailles). LISTE : liste déroulante (accompagnement). */
  affichage: 'TUILES' | 'LISTE'
  options: OptionVariante[]
}

export interface ExtraPlat {
  id: number
  nom: string
  prix: number
}

export interface AddonPlat {
  id: number
  nom: string
  prix: number
  disponible: boolean
  photoUrl: string | null
}

export interface PlatMenu {
  id: number
  nom: string
  /** Poste de préparation, hérité de la catégorie. */
  poste: 'BAR' | 'CUISINE'
  description: string | null
  prix: number
  disponible: boolean
  photoUrl: string | null
  /** Aperçu flouté de quelques centaines d'octets, affiché pendant le chargement de la photo. */
  photoFloueUrl: string | null
  /** Auteur et licence d'une photo sous licence libre, affichés avec la photo. */
  photoCredit: string | null
  groupesVariantes: GroupeVariante[]
  extras: ExtraPlat[]
  addons: AddonPlat[]
}

export interface CategorieMenu {
  id: number
  nom: string
  /** Vignette ronde affichée dans la puce de la catégorie. */
  imageUrl: string | null
  plats: PlatMenu[]
}

export interface MenuTable {
  restaurant: { nom: string }
  table: { numero: number; nombreChaises: number }
  categories: CategorieMenu[]
}
