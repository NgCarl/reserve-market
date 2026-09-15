import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { messageErreur, requeteApi } from '@/lib/api'
import { classeChamp } from '@/lib/formulaire'
import type { TableAdmin } from '@/types/table'

const PLACES_MAX = 30

interface Props {
  ouvert: boolean
  /** null : ajout d'une nouvelle table. */
  table: TableAdmin | null
  numeroPropose: number
  onFermer: () => void
  onEnregistree: () => void
}

/** Ajout ou modification d'une table : numéro et nombre de places. À rendre avec une key par table. */
export function DialogueTable({ ouvert, table, numeroPropose, onFermer, onEnregistree }: Props) {
  const [numero, setNumero] = useState(String(table?.numero ?? numeroPropose))
  const [places, setPlaces] = useState(table?.nombreChaises ?? 6)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const numeroValide = /^\d{1,3}$/.test(numero) && Number(numero) >= 1
  const changerPlaces = (valeur: number) => setPlaces(Math.min(PLACES_MAX, Math.max(1, valeur)))

  const enregistrer = async () => {
    if (!numeroValide || enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      await requeteApi<{ table: TableAdmin }>(table ? `/tables/${table.id}` : '/tables', {
        method: table ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: Number(numero), nombreChaises: places }),
      })
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
            <DialogTitle className="text-xl text-marque-nuit">{table ? `Modifier la table ${table.numero}` : 'Ajouter une table'}</DialogTitle>
            <DialogDescription>Le nombre de places fixe les boutons « votre place » proposés au client lors de sa commande.</DialogDescription>
          </DialogHeader>

          {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{erreur}</p>}

          <div className="flex flex-col gap-2">
            <label htmlFor="table-numero" className="text-sm font-medium text-marque-nuit">Numéro de la table</label>
            <input
              id="table-numero"
              inputMode="numeric"
              maxLength={3}
              value={numero}
              onChange={(evenement) => setNumero(evenement.target.value.replace(/\D/g, ''))}
              className={classeChamp}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="table-places" className="text-sm font-medium text-marque-nuit">Nombre de places</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changerPlaces(places - 1)}
                disabled={places <= 1}
                aria-label="Une place de moins"
                className="flex size-12 items-center justify-center rounded-lg border border-border text-primary disabled:opacity-40"
              >
                <Minus className="size-5" />
              </button>
              <input
                id="table-places"
                inputMode="numeric"
                value={places}
                onChange={(evenement) => changerPlaces(Number(evenement.target.value.replace(/\D/g, '')) || 1)}
                className={`${classeChamp} w-20 text-center text-lg font-semibold`}
              />
              <button
                type="button"
                onClick={() => changerPlaces(places + 1)}
                disabled={places >= PLACES_MAX}
                aria-label="Une place de plus"
                className="flex size-12 items-center justify-center rounded-lg border border-border text-primary disabled:opacity-40"
              >
                <Plus className="size-5" />
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={onFermer}
              className="h-11 rounded-lg border border-border bg-white px-4 font-semibold text-marque-nuit hover:bg-tuile"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!numeroValide || enCours}
              className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {enCours ? 'Enregistrement…' : table ? 'Enregistrer' : 'Ajouter la table'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
