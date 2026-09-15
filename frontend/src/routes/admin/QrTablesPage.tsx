import { ArrowLeft, Printer } from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import { AvertissementUrl } from '@/components/admin/AvertissementUrl'
import { FicheQr } from '@/components/admin/FicheQr'
import type { chargerTables } from './admin.loader'

/** Toutes les fiches QR, pour imprimer d'un coup les QR de toutes les tables. */
export function QrTablesPage() {
  const { restaurant, tables } = useLoaderData<typeof chargerTables>()
  const premiere = tables[0]

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-5 py-4 shadow-[0_1px_3px_rgba(3,40,66,0.06)] print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/admin/tables" aria-label="Retour aux tables" className="flex size-10 items-center justify-center rounded-full bg-tuile text-primary">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-medium text-marque-nuit">QR codes des tables</h1>
            <p className="text-sm text-muted-foreground">{tables.length} fiche{tables.length > 1 ? 's' : ''}, à découper et poser sur chaque table.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={tables.length === 0}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-medium text-primary-foreground disabled:opacity-50"
        >
          <Printer className="size-4" />
          Imprimer
        </button>
      </div>

      {premiere && <AvertissementUrl urlMenu={premiere.urlMenu} className="mb-4" />}

      <div className="grid justify-items-center gap-5 sm:grid-cols-2 2xl:grid-cols-3 print:grid-cols-2 print:gap-6">
        {tables.map((table) => (
          <FicheQr key={table.id} restaurant={restaurant} table={table} />
        ))}
      </div>
    </section>
  )
}
