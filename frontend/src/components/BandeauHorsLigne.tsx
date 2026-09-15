import { WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { heureRestaurant } from '@/lib/journee'

interface Props {
  /** Date.now() de la dernière réception depuis le serveur. */
  recuLe: number
  children?: ReactNode
}

/** Connexion perdue (§7) : l'écran garde les dernières données reçues et se remet à jour au retour du réseau. */
export function BandeauHorsLigne({ recuLe, children }: Props) {
  return (
    <p role="status" className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
      <WifiOff className="mt-0.5 size-4 shrink-0" />
      <span>
        <strong className="font-semibold">Hors connexion.</strong> Dernières données reçues à {heureRestaurant.format(recuLe)}.{' '}
        {children ?? "L'écran se remet à jour dès le retour du réseau ; en attendant, les actions ne sont pas envoyées."}
      </span>
    </p>
  )
}
