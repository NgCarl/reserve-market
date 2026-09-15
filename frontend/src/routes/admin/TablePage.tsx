import { ArrowLeft, Printer, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData, useRevalidator } from 'react-router'
import { AvertissementUrl } from '@/components/admin/AvertissementUrl'
import { DialogueConfirmation } from '@/components/admin/DialogueConfirmation'
import { FicheQr } from '@/components/admin/FicheQr'
import { requeteApi } from '@/lib/api'
import type { chargerTable } from './admin.loader'

/** Fiche QR d'une table, prête à imprimer (maquette FoodScan « Dining Tables / View »). */
export function TablePage() {
  const { restaurant, table } = useLoaderData<typeof chargerTable>()
  const { revalidate } = useRevalidator()
  const [confirmer, setConfirmer] = useState(false)

  const regenerer = async () => {
    await requeteApi(`/tables/${table.id}/jeton`, { method: 'POST' })
    setConfirmer(false)
    await revalidate()
  }

  return (
    <section className="rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)] print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/admin/tables" aria-label="Retour aux tables" className="flex size-10 items-center justify-center rounded-full bg-tuile text-primary">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-xl font-medium text-marque-nuit">Table {table.numero}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConfirmer(true)}
            className="flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <RefreshCw className="size-4" />
            Régénérer le QR
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-medium text-primary-foreground"
          >
            <Printer className="size-4" />
            Imprimer
          </button>
        </div>
      </div>

      <AvertissementUrl urlMenu={table.urlMenu} className="mx-5 mt-4" />

      <div className="flex justify-center p-6 print:p-0">
        <FicheQr restaurant={restaurant} table={table} />
      </div>

      <DialogueConfirmation
        key={String(confirmer)}
        ouvert={confirmer}
        titre={`Régénérer le QR de la table ${table.numero}`}
        description="Le QR code actuel cessera aussitôt de fonctionner, y compris sur la fiche déjà posée sur la table. Réimprimez la nouvelle fiche juste après."
        libelleConfirmer="Régénérer"
        onConfirmer={regenerer}
        onFermer={() => setConfirmer(false)}
      />
    </section>
  )
}
