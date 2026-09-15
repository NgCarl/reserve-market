import { classeChamp, classeChampCompact } from '@/lib/formulaire'

interface Props {
  id?: string
  valeur: number | null
  onChange: (valeur: number | null) => void
  libelle?: string
  compact?: boolean
  suffixe?: string
}

/** Montant entier en FCFA (CLAUDE.md §6) : seuls les chiffres sont acceptés, jamais de décimale. */
export function ChampMontant({ id, valeur, onChange, libelle, compact = false, suffixe = 'FCFA' }: Props) {
  return (
    <div className="relative">
      <input
        id={id}
        inputMode="numeric"
        aria-label={libelle}
        value={valeur ?? ''}
        onChange={(evenement) => {
          const chiffres = evenement.target.value.replace(/\D/g, '').slice(0, 8)
          onChange(chiffres === '' ? null : Number(chiffres))
        }}
        className={`${compact ? classeChampCompact : classeChamp} pr-14`}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{suffixe}</span>
    </div>
  )
}
