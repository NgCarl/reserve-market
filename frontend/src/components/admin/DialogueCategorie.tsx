import { ChefHat, Wine } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { classeChamp } from '@/lib/formulaire'
import { cn } from '@/lib/utils'
import type { CategorieAdmin } from '@/types/carte'
import type { Poste } from '@/types/cuisine'

const POSTES: { valeur: Poste; libelle: string; detail: string; Icone: typeof ChefHat }[] = [
  { valeur: 'CUISINE', libelle: 'Cuisine', detail: 'Plats préparés en cuisine', Icone: ChefHat },
  { valeur: 'BAR', libelle: 'Bar', detail: 'Boissons, glaces, cocktails', Icone: Wine },
]

interface Props {
  ouvert: boolean
  /** null : nouvelle catégorie. */
  categorie: CategorieAdmin | null
  onFermer: () => void
  onEnregistree: () => void
}

/** Ajout ou modification d'une catégorie. À rendre avec une key par catégorie. */
export function DialogueCategorie({ ouvert, categorie, onFermer, onEnregistree }: Props) {
  const [nom, setNom] = useState(categorie?.nom ?? '')
  const [poste, setPoste] = useState<Poste>(categorie?.poste ?? 'CUISINE')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const enregistrer = async () => {
    if (nom.trim() === '' || enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      await requeteApi(categorie ? `/categories/${categorie.id}` : '/categories', enJson(categorie ? 'PATCH' : 'POST', { nom, poste }))
      onEnregistree()
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Enregistrement impossible. Réessayez.'))
      setEnCours(false)
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={(etat) => !etat && onFermer()}>
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          onSubmit={(evenement) => {
            evenement.preventDefault()
            void enregistrer()
          }}
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle className="text-xl text-marque-nuit">{categorie ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</DialogTitle>
            <DialogDescription>Le poste décide où partent les commandes : colonne Cuisine ou colonne Bar de l'écran cuisine.</DialogDescription>
          </DialogHeader>

          {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{erreur}</p>}

          <div className="flex flex-col gap-2">
            <label htmlFor="categorie-nom" className="text-sm font-medium text-marque-nuit">Nom</label>
            <input
              id="categorie-nom"
              maxLength={80}
              value={nom}
              onChange={(evenement) => setNom(evenement.target.value)}
              placeholder="Grillades, Jus, Desserts…"
              className={classeChamp}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-marque-nuit">Poste</legend>
            <div className="grid grid-cols-2 gap-3" role="radiogroup">
              {POSTES.map(({ valeur, libelle, detail, Icone }) => (
                <button
                  key={valeur}
                  type="button"
                  role="radio"
                  aria-checked={poste === valeur}
                  onClick={() => setPoste(valeur)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition-colors',
                    poste === valeur ? 'border-primary bg-primary/5 text-primary' : 'border-border text-marque-nuit',
                  )}
                >
                  <Icone className="size-6" />
                  <span className="font-semibold">{libelle}</span>
                  <span className="text-xs text-muted-foreground">{detail}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <DialogFooter className="gap-2">
            <button type="button" onClick={onFermer} className="h-11 rounded-lg border border-border bg-white px-4 font-semibold text-marque-nuit hover:bg-tuile">
              Annuler
            </button>
            <button
              type="submit"
              disabled={nom.trim() === '' || enCours}
              className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {enCours ? 'Enregistrement…' : categorie ? 'Enregistrer' : 'Ajouter la catégorie'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
