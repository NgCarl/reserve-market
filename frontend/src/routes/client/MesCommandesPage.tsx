import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Link, useLoaderData, useParams } from 'react-router'
import { useMenu } from '@/hooks/useMenu'
import { formaterPrix } from '@/lib/format'
import { COULEURS_STATUT, LIBELLES_STATUT } from '@/lib/statut'
import { cn } from '@/lib/utils'
import type { chargerCommandesTable } from './commande.loader'

const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Commandes de la table pendant le service, pour retrouver chaque suivi. */
export function MesCommandesPage() {
  const { commandes } = useLoaderData<typeof chargerCommandesTable>()
  const menu = useMenu()
  const { jeton = '' } = useParams()
  const retourMenu = `/menu/${jeton}`

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-white px-4">
        <Link to={retourMenu} aria-label="Retour au menu" className="flex size-10 items-center justify-center rounded-full bg-tuile text-primary">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-marque-nuit">Mes commandes</h1>
        <span className="ml-auto rounded-full border border-border px-3 py-1 text-sm font-semibold text-marque-nuit">Table {menu.table.numero}</span>
      </header>

      <main className="flex flex-col gap-3 p-4 pb-10">
        {commandes.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">Aucune commande en cours pour cette table.</p>
        ) : (
          commandes.map((commande) => {
            const articles = commande.lignes.filter((ligne) => ligne.statut !== 'ANNULEE').reduce((total, ligne) => total + ligne.quantite, 0)
            return (
              <Link
                key={commande.id}
                to={`/menu/${jeton}/commandes/${commande.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-tuile"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-marque-nuit">
                      Commande n° <span className="text-primary">{commande.id}</span>
                    </span>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', COULEURS_STATUT[commande.statut])}>
                      {LIBELLES_STATUT[commande.statut]}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {heure.format(new Date(commande.creeLe))}
                    {commande.chaise !== null && ` · Place ${commande.chaise}`} · {articles} article{articles > 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-emerald-600">{formaterPrix(commande.total)}</span>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            )
          })
        )}

        <Link to={retourMenu} className="mt-2 flex h-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
          Commander autre chose
        </Link>
      </main>
    </div>
  )
}
