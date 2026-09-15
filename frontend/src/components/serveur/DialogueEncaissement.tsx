import { Banknote, Smartphone, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { formaterPrix } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ModePaiement } from '@/types/gestion'
import type { TableSalle } from '@/types/salle'

export interface CibleEncaissement {
  table: TableSalle
  /** Mode demandé par le client, s'il a demandé l'addition. */
  mode: ModePaiement | null
}

interface Props {
  cible: CibleEncaissement | null
  onFermer: () => void
  onEncaisse: (message: string) => void
}

const MODES: { valeur: ModePaiement; libelle: string; Icone: typeof Banknote }[] = [
  { valeur: 'ESPECES', libelle: 'Espèces', Icone: Banknote },
  { valeur: 'MOBILE_MONEY', libelle: 'Mobile Money', Icone: Smartphone },
]

/** Encaissement d'une table, à valider seulement une fois l'argent reçu (§6). À rendre avec une key par table. */
export function DialogueEncaissement({ cible, onFermer, onEncaisse }: Props) {
  const [mode, setMode] = useState<ModePaiement | null>(cible?.mode ?? null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const nonServis = cible ? cible.table.enCours.length + cible.table.aServir.length : 0

  const confirmer = async () => {
    if (!cible || !mode || enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      const { encaissement } = await requeteApi<{ encaissement: { montant: number } }>(
        `/serveur/tables/${cible.table.table.id}/encaissement`,
        enJson('POST', { modePaiement: mode }),
      )
      onEncaisse(`Table ${cible.table.table.numero} encaissée : ${formaterPrix(encaissement.montant)} ${mode === 'ESPECES' ? 'en espèces' : 'par Mobile Money'}.`)
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Encaissement impossible. Réessayez.'))
      setEnCours(false)
    }
  }

  return (
    <Dialog open={cible !== null} onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-marque-nuit">Encaisser la table {cible?.table.table.numero}</DialogTitle>
          <DialogDescription>Validez seulement quand vous avez reçu l'argent. Le tableau de bord compte ce montant comme encaissé.</DialogDescription>
        </DialogHeader>

        <p className="text-center text-3xl font-bold text-emerald-700 tabular-nums">{formaterPrix(cible?.table.total ?? 0)}</p>

        {nonServis > 0 && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {nonServis} article{nonServis > 1 ? 's' : ''} pas encore servi{nonServis > 1 ? 's' : ''} : encaissez seulement si le client règle maintenant.
          </p>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-marque-nuit">Mode de paiement</legend>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {MODES.map(({ valeur, libelle, Icone }) => (
              <button
                key={valeur}
                type="button"
                role="radio"
                aria-checked={mode === valeur}
                onClick={() => setMode(valeur)}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 font-semibold transition-colors',
                  mode === valeur ? 'border-primary bg-primary/5 text-primary' : 'border-border text-marque-nuit',
                )}
              >
                <Icone className="size-5" />
                {libelle}
              </button>
            ))}
          </div>
        </fieldset>

        {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{erreur}</p>}

        <DialogFooter className="gap-2">
          <button type="button" onClick={onFermer} className="h-11 rounded-lg border border-border bg-white px-4 font-semibold text-marque-nuit hover:bg-tuile">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void confirmer()}
            disabled={!mode || enCours}
            className="h-11 rounded-lg bg-emerald-700 px-4 font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {enCours ? 'Encaissement…' : 'Argent reçu'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
