import { ShoppingBag } from 'lucide-react'
import logo from '@/assets/logo-reserve-market.webp'
import { formaterPrix } from '@/lib/format'

interface Props {
  numeroTable: number
  articles: number
  total: number
  onOuvrirPanier: () => void
}

/** En-tête blanc, panier en pastille sombre avec le total (maquette FoodScan « menu »). */
export function EnteteMenu({ numeroTable, articles, total, onOuvrirPanier }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border bg-white px-4">
      <img src={logo} alt="Réserve Market" width={118} height={48} className="h-11 w-auto" />
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-marque-nuit">
          Table {numeroTable}
        </span>
        <button
          type="button"
          onClick={onOuvrirPanier}
          aria-label={`Ouvrir le panier : ${articles} article${articles > 1 ? 's' : ''}, ${formaterPrix(total)}`}
          className="flex h-11 items-center gap-2 rounded-full bg-marque-nuit px-4 text-[15px] font-bold text-white transition-transform active:scale-95"
        >
          <ShoppingBag className="size-5" />
          {formaterPrix(total)}
        </button>
      </div>
    </header>
  )
}
