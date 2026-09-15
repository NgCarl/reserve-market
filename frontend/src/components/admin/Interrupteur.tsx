import { cn } from '@/lib/utils'

interface Props {
  actif: boolean
  onChange: (actif: boolean) => void
  libelle: string
  desactive?: boolean
}

/** Interrupteur marche/arrêt (disponible, suivi du stock). */
export function Interrupteur({ actif, onChange, libelle, desactive = false }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      disabled={desactive}
      onClick={() => onChange(!actif)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-primary/25 focus-visible:outline-none disabled:opacity-50',
        actif ? 'bg-emerald-500' : 'bg-slate-300',
      )}
    >
      <span className={cn('inline-block size-5 rounded-full bg-white shadow transition-transform', actif ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  )
}
