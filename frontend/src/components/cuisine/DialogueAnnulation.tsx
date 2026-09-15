import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CarteTable, LigneCarte } from '@/lib/cuisine'
import { cn } from '@/lib/utils'

export interface ArticleAAnnuler {
  ligne: LigneCarte
  carte: CarteTable
}

interface Props {
  article: ArticleAAnnuler | null
  onFermer: () => void
  onConfirmer: (motif: string) => Promise<void>
}

const MOTIFS = ['Rupture de stock', 'Erreur de commande', 'Autre'] as const
type Motif = (typeof MOTIFS)[number]

/** Annulation d'un article par la cuisine : motif obligatoire, enregistré avec l'annulation (§6). À rendre avec une key par article. */
export function DialogueAnnulation({ article, onFermer, onConfirmer }: Props) {
  const [motif, setMotif] = useState<Motif>('Rupture de stock')
  const [precision, setPrecision] = useState('')
  const [enCours, setEnCours] = useState(false)

  const texteMotif = motif === 'Autre' ? precision.trim() : motif
  const valide = texteMotif.length >= 3

  const confirmer = async () => {
    if (!valide || enCours) return
    setEnCours(true)
    await onConfirmer(texteMotif)
    setEnCours(false)
  }

  return (
    <Dialog open={article !== null} onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-marque-nuit">Annuler un article</DialogTitle>
          {article && (
            <DialogDescription>
              {article.ligne.quantite}x {article.ligne.nomPlat} · Table {article.carte.table.numero} · commande #{article.ligne.commandeId}.
              Le client verra l'article annulé sur son suivi.
            </DialogDescription>
          )}
        </DialogHeader>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-marque-nuit">Motif</legend>
          {MOTIFS.map((valeur) => (
            <label
              key={valeur}
              className={cn(
                'flex h-12 cursor-pointer items-center gap-3 rounded-lg border px-3.5 text-marque-nuit transition-colors',
                motif === valeur ? 'border-primary bg-primary/5' : 'border-border',
              )}
            >
              <input
                type="radio"
                name="motif"
                value={valeur}
                checked={motif === valeur}
                onChange={() => setMotif(valeur)}
                className="size-4 accent-primary"
              />
              {valeur}
            </label>
          ))}
          {motif === 'Autre' && (
            <textarea
              value={precision}
              onChange={(evenement) => setPrecision(evenement.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Précisez le motif (3 caractères minimum)"
              aria-label="Précision du motif"
              className="mt-1 w-full resize-none rounded-lg border border-border px-3.5 py-2.5 text-base outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
            />
          )}
        </fieldset>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={onFermer}
            className="h-11 rounded-lg border border-border bg-white px-4 font-semibold text-marque-nuit hover:bg-tuile"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={() => void confirmer()}
            disabled={!valide || enCours}
            className="h-11 rounded-lg bg-red-600 px-4 font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {enCours ? 'Annulation…' : "Annuler l'article"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
