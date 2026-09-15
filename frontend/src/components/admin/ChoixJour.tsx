import { classeListeCompacte } from '@/lib/formulaire'
import { jourRestaurant } from '@/lib/journee'

interface Props {
  /** Journée affichée, AAAA-MM-JJ. */
  jour: string
  /** null : revenir à aujourd'hui. */
  onChange: (jour: string | null) => void
}

/** Choix de la journée consultée (tableau de bord, commandes). Pas de date future. */
export function ChoixJour({ jour, onChange }: Props) {
  const aujourdhui = jourRestaurant()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="choix-jour" className="sr-only">Journée</label>
      <input
        id="choix-jour"
        type="date"
        value={jour}
        max={aujourdhui}
        onChange={(evenement) => onChange(evenement.target.value === '' || evenement.target.value === aujourdhui ? null : evenement.target.value)}
        className={classeListeCompacte}
      />
      {jour !== aujourdhui && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="h-10 rounded-lg border border-primary px-3 text-sm font-semibold text-primary hover:bg-primary/5"
        >
          Aujourd'hui
        </button>
      )}
    </div>
  )
}
