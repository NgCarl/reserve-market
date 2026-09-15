import { useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { messageErreur } from '@/lib/api'

interface Props {
  ouvert: boolean
  titre: string
  description: ReactNode
  libelleConfirmer: string
  /** Rejette en cas d'échec : le message du serveur s'affiche dans la fenêtre. Au succès, le parent ferme la fenêtre. */
  onConfirmer: () => Promise<void>
  onFermer: () => void
}

/** Confirmation d'une action difficile à annuler (suppression, régénération du QR). À rendre avec une key par cible. */
export function DialogueConfirmation({ ouvert, titre, description, libelleConfirmer, onConfirmer, onFermer }: Props) {
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const confirmer = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      await onConfirmer()
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Action impossible. Réessayez.'))
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
        {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{erreur}</p>}
        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={onFermer}
            className="h-11 rounded-lg border border-border bg-white px-4 font-semibold text-marque-nuit hover:bg-tuile"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void confirmer()}
            disabled={enCours}
            className="h-11 rounded-lg bg-red-600 px-4 font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {enCours ? 'Patientez…' : libelleConfirmer}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
