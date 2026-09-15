import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { messageErreur } from '@/lib/api'
import { cn } from '@/lib/utils'

const MOTIFS = ['Le client a changé d’avis', 'Erreur de saisie', 'Autre'] as const
type Motif = (typeof MOTIFS)[number]

interface Props {
  ouvert: boolean
  titre: string
  description: string
  /** Rejette en cas d'échec : le message s'affiche dans la fenêtre. */
  onConfirmer: (motif: string) => Promise<void>
  onFermer: () => void
}

/** Annulation d'un article par le serveur, avant sa préparation : motif obligatoire (§6). À rendre avec une key par article. */
export function DialogueMotif({ ouvert, titre, description, onConfirmer, onFermer }: Props) {
  const [motif, setMotif] = useState<Motif>(MOTIFS[0])
  const [precision, setPrecision] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const texte = motif === 'Autre' ? precision.trim() : motif

  const confirmer = async () => {
    if (texte.length < 3 || enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      await onConfirmer(texte)
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Annulation impossible. Réessayez.'))
      setEnCours(false)
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={(etat) => !etat && onFermer()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-marque-nuit">{titre}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
              <input type="radio" name="motif-serveur" checked={motif === valeur} onChange={() => setMotif(valeur)} className="size-4 accent-primary" />
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

        {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{erreur}</p>}

        <DialogFooter className="gap-2">
          <button type="button" onClick={onFermer} className="h-11 rounded-lg border border-border bg-white px-4 font-semibold text-marque-nuit hover:bg-tuile">
            Retour
          </button>
          <button
            type="button"
            onClick={() => void confirmer()}
            disabled={texte.length < 3 || enCours}
            className="h-11 rounded-lg bg-red-600 px-4 font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {enCours ? 'Annulation…' : "Annuler l'article"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
