import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

// Adresses joignables seulement depuis l'ordinateur ou le réseau du restaurant.
const ADRESSE_LOCALE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/

interface Props {
  urlMenu: string
  className?: string
}

/** Prévient avant d'imprimer des QR qui pointent vers une adresse locale (URL_PUBLIQUE non définie). */
export function AvertissementUrl({ urlMenu, className }: Props) {
  const { host, hostname } = new URL(urlMenu)
  if (!ADRESSE_LOCALE.test(hostname)) return null
  return (
    <p role="note" className={cn('flex items-start gap-2.5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden', className)}>
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <span>
        Ces QR codes pointent vers <strong>{host}</strong>, une adresse du réseau local : ils ne fonctionneront pas ailleurs.
        Imprimez les fiches définitives une fois le site en ligne.
      </span>
    </p>
  )
}
