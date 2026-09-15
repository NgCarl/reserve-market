interface Props {
  modifie: boolean
  enCours: boolean
  /** Formulaire incomplet : on explique pourquoi l'enregistrement est bloqué. */
  incomplet?: string | null
  onEnregistrer: () => void
  onAnnuler: () => void
}

/** Bas de formulaire : état des modifications, annuler, enregistrer. */
export function BarreEnregistrement({ modifie, enCours, incomplet = null, onEnregistrer, onAnnuler }: Props) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
      <p className="mr-auto text-sm text-muted-foreground">
        {incomplet ?? (modifie ? 'Modifications non enregistrées.' : 'Tout est enregistré.')}
      </p>
      <button
        type="button"
        onClick={onAnnuler}
        disabled={!modifie || enCours}
        className="h-10 rounded-lg border border-border bg-white px-4 font-semibold text-marque-nuit hover:bg-tuile disabled:opacity-40"
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={onEnregistrer}
        disabled={!modifie || enCours || incomplet !== null}
        className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
      >
        {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  )
}
