import { X } from 'lucide-react'
import { SheetClose } from '@/components/ui/sheet'

/** Bouton de fermeture rond et rouge des panneaux (maquettes FoodScan). */
export function BoutonFermer({ plein = false }: { plein?: boolean }) {
  return (
    <SheetClose
      aria-label="Fermer"
      className={
        plein
          ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-white'
          : 'flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-red-500 text-red-500'
      }
    >
      <X className="size-5" strokeWidth={2.5} />
    </SheetClose>
  )
}
