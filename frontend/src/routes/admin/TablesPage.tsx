import { CirclePlus, Pencil, Printer, QrCode, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData, useRevalidator } from 'react-router'
import { DialogueConfirmation } from '@/components/admin/DialogueConfirmation'
import { DialogueTable } from '@/components/admin/DialogueTable'
import { requeteApi } from '@/lib/api'
import type { TableAdmin } from '@/types/table'
import type { chargerTables } from './admin.loader'

const actionIcone = 'flex size-8 items-center justify-center rounded-md transition-colors'

/** Tables du restaurant (maquette FoodScan « Dining Tables ») : ajout, places, QR code, suppression. */
export function TablesPage() {
  const { tables } = useLoaderData<typeof chargerTables>()
  const { revalidate } = useRevalidator()
  const [edition, setEdition] = useState<{ table: TableAdmin | null } | null>(null)
  const [aSupprimer, setASupprimer] = useState<TableAdmin | null>(null)

  const totalPlaces = tables.reduce((total, table) => total + table.nombreChaises, 0)
  const numeroPropose = tables.reduce((max, table) => Math.max(max, table.numero), 0) + 1

  const supprimer = async () => {
    if (!aSupprimer) return
    await requeteApi<void>(`/tables/${aSupprimer.id}`, { method: 'DELETE' })
    setASupprimer(null)
    await revalidate()
  }

  return (
    <section className="rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h1 className="text-xl font-medium text-marque-nuit">Tables et QR codes</h1>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/tables/qr"
            className="flex h-10 items-center gap-2 rounded-lg border border-primary px-4 text-[15px] font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <Printer className="size-4" />
            Imprimer tous les QR
          </Link>
          <button
            type="button"
            onClick={() => setEdition({ table: null })}
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-medium text-primary-foreground"
          >
            <CirclePlus className="size-4" />
            Ajouter une table
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <p className="px-5 py-10 text-center text-muted-foreground">Aucune table. Ajoutez la première pour générer son QR code.</p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[15px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.15em] text-marque-nuit uppercase">
                <th scope="col" className="px-5 py-3.5 font-medium">Nom</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Places</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Statut</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3 text-marque-nuit">Table {table.numero}</td>
                  <td className="px-5 py-3 text-marque-nuit">{table.nombreChaises}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm text-emerald-700">Active</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/tables/${table.id}`}
                        aria-label={`QR code de la table ${table.numero}`}
                        title="QR code"
                        className={`${actionIcone} bg-amber-50 text-amber-600 hover:bg-amber-100`}
                      >
                        <QrCode className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEdition({ table })}
                        aria-label={`Modifier la table ${table.numero}`}
                        title="Modifier"
                        className={`${actionIcone} bg-emerald-50 text-emerald-600 hover:bg-emerald-100`}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setASupprimer(table)}
                        aria-label={`Supprimer la table ${table.numero}`}
                        title="Supprimer"
                        className={`${actionIcone} bg-red-50 text-red-600 hover:bg-red-100`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="border-t border-border px-5 py-4 text-sm text-marque-nuit">
        {tables.length} table{tables.length > 1 ? 's' : ''} · {totalPlaces} place{totalPlaces > 1 ? 's' : ''}
      </p>

      <DialogueTable
        key={edition ? (edition.table?.id ?? 'nouvelle') : 'fermee'}
        ouvert={edition !== null}
        table={edition?.table ?? null}
        numeroPropose={numeroPropose}
        onFermer={() => setEdition(null)}
        onEnregistree={() => {
          setEdition(null)
          void revalidate()
        }}
      />

      <DialogueConfirmation
        key={aSupprimer?.id ?? 'aucune'}
        ouvert={aSupprimer !== null}
        titre={`Supprimer la table ${aSupprimer?.numero ?? ''}`}
        description="Son QR code cessera aussitôt de fonctionner. Les commandes déjà passées restent dans l'historique."
        libelleConfirmer="Supprimer la table"
        onConfirmer={supprimer}
        onFermer={() => setASupprimer(null)}
      />
    </section>
  )
}
