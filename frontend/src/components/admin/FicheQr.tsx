import logo from '@/assets/logo-reserve-market.webp'
import type { RestaurantInfos, TableAdmin } from '@/types/table'

interface Props {
  restaurant: RestaurantInfos
  table: TableAdmin
}

/** Fiche à poser sur la table (maquette FoodScan « Dining Tables / View ») : logo, coordonnées, QR code, numéro. */
export function FicheQr({ restaurant, table }: Props) {
  return (
    <article className="flex w-full max-w-[340px] break-inside-avoid flex-col items-center gap-3 rounded-2xl border border-border bg-white px-6 py-7 text-center print:border-marque-nuit/40">
      <img src={logo} alt="Réserve Market" width={118} height={48} className="h-14 w-auto" />
      <div className="text-sm leading-snug text-muted-foreground">
        <p className="font-semibold text-marque-nuit">{restaurant.nom}</p>
        {restaurant.telephone && <p>{restaurant.telephone}</p>}
        {restaurant.adresse && <p>{restaurant.adresse}</p>}
      </div>
      {/* ?v= : nouvelle image après une régénération, le navigateur ne réutilise pas l'ancien QR. */}
      <img
        src={`/api/tables/${table.id}/qr.svg?v=${encodeURIComponent(table.urlMenu.slice(-8))}`}
        alt={`QR code de la table ${table.numero}`}
        width={210}
        height={210}
        className="size-[210px]"
      />
      <p className="text-3xl font-bold text-marque-nuit">Table {table.numero}</p>
      <p className="text-sm text-muted-foreground">{table.nombreChaises} place{table.nombreChaises > 1 ? 's' : ''}</p>
      <p className="font-medium text-marque-nuit">Scannez le QR code pour voir la carte et commander</p>
      <p className="text-lg font-bold text-primary">Merci !</p>
    </article>
  )
}
