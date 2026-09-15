import { ChefHat, Wine } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Poste } from '@/types/cuisine'

/** Poste d'une catégorie : là où partent ses commandes (colonne Cuisine ou Bar de l'écran cuisine). */
export function PastillePoste({ poste }: { poste: Poste }) {
  const Icone = poste === 'BAR' ? Wine : ChefHat
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm', poste === 'BAR' ? 'bg-sky-50 text-sky-700' : 'bg-orange-50 text-orange-700')}>
      <Icone className="size-3.5" />
      {poste === 'BAR' ? 'Bar' : 'Cuisine'}
    </span>
  )
}
