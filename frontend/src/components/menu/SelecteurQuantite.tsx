import { Minus, Plus, Trash2 } from 'lucide-react'

interface Props {
  quantite: number
  onChange: (quantite: number) => void
  min?: number
  max?: number
  /** Nom de l'article, pour les lecteurs d'écran. */
  libelle: string
}

const bouton = 'flex size-8 items-center justify-center rounded-full border-2 border-primary text-primary transition-opacity disabled:opacity-30'

/** Sélecteur en pastille grise, boutons ronds cerclés de bleu (maquette FoodScan). */
export function SelecteurQuantite({ quantite, onChange, min = 1, max = 99, libelle }: Props) {
  const retirer = min === 0 && quantite === 1

  return (
    <div className="flex items-center gap-2.5 rounded-full bg-tuile p-1.5">
      <button
        type="button"
        className={bouton}
        onClick={() => onChange(quantite - 1)}
        disabled={quantite <= min}
        aria-label={retirer ? `Retirer ${libelle}` : `Diminuer la quantité de ${libelle}`}
      >
        {retirer ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
      </button>
      <span className="w-5 text-center text-base font-bold tabular-nums" aria-live="polite">{quantite}</span>
      <button
        type="button"
        className={bouton}
        onClick={() => onChange(quantite + 1)}
        disabled={quantite >= max}
        aria-label={`Augmenter la quantité de ${libelle}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
