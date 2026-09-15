import { ChevronRight, Flame, RefreshCw } from 'lucide-react'
import { Link, useLoaderData, useNavigation, useRevalidator, useSearchParams } from 'react-router'
import { ChoixJour } from '@/components/admin/ChoixJour'
import { formaterPrix } from '@/lib/format'
import { classeListeCompacte } from '@/lib/formulaire'
import { dateLongue, heureRestaurant, jourRestaurant } from '@/lib/journee'
import { COULEURS_STATUT, LIBELLES_STATUT } from '@/lib/statut'
import { cn } from '@/lib/utils'
import type { StatutCommande } from '@/types/commande'
import type { chargerCommandesJour } from './admin.loader'

const STATUTS: StatutCommande[] = ['RECUE', 'EN_PREPARATION', 'PRETE', 'SERVIE', 'ANNULEE']

/** Commandes d'une journée (maquette FoodScan « Table Orders ») : filtres, montants, statut, encaissement. */
export function CommandesPage() {
  const { jour, commandes, total, tables } = useLoaderData<typeof chargerCommandesJour>()
  const [parametres, setParametres] = useSearchParams()
  const { revalidate, state } = useRevalidator()
  const navigation = useNavigation()
  const chargement = state === 'loading' || navigation.state === 'loading'
  const aujourdhui = jour === jourRestaurant()

  const changer = (nom: 'date' | 'statut' | 'table', valeur: string | null) => {
    const suivants = new URLSearchParams(parametres)
    if (valeur) {
      suivants.set(nom, valeur)
    } else {
      suivants.delete(nom)
    }
    setParametres(suivants, { replace: true })
  }

  return (
    <section className="rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h1 className="text-xl font-medium text-marque-nuit first-letter:uppercase">
          {aujourdhui ? 'Commandes du jour' : `Commandes du ${dateLongue(jour)}`}
        </h1>
        <button
          type="button"
          onClick={() => void revalidate()}
          disabled={chargement}
          className="flex h-10 items-center gap-2 rounded-lg border border-primary px-4 text-[15px] font-medium text-primary hover:bg-primary/5 disabled:opacity-60"
        >
          <RefreshCw className={cn('size-4', chargement && 'animate-spin')} />
          Actualiser
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
        <ChoixJour jour={jour} onChange={(valeur) => changer('date', valeur)} />
        <select
          aria-label="Filtrer par statut"
          value={parametres.get('statut') ?? ''}
          onChange={(evenement) => changer('statut', evenement.target.value || null)}
          className={classeListeCompacte}
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((statut) => (
            <option key={statut} value={statut}>{LIBELLES_STATUT[statut]}</option>
          ))}
        </select>
        <select
          aria-label="Filtrer par table"
          value={parametres.get('table') ?? ''}
          onChange={(evenement) => changer('table', evenement.target.value || null)}
          className={classeListeCompacte}
        >
          <option value="">Toutes les tables</option>
          {tables.map((table) => (
            <option key={table.id} value={table.numero}>Table {table.numero}</option>
          ))}
        </select>
      </div>

      {commandes.length === 0 ? (
        <p className="px-5 py-12 text-center text-muted-foreground">
          Aucune commande {parametres.has('statut') || parametres.has('table') ? 'ne correspond à ces filtres' : aujourdhui ? "pour l'instant" : 'ce jour-là'}.
        </p>
      ) : (
        <div className={cn('relative overflow-x-auto transition-opacity', chargement && 'opacity-60')}>
          <table className="w-full min-w-[860px] text-left text-[15px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.15em] text-marque-nuit uppercase">
                <th scope="col" className="px-5 py-3.5 font-medium">Commande</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Table</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Articles</th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">Montant</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Heure</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Statut</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Paiement</th>
                <th scope="col" className="px-5 py-3.5 font-medium"><span className="sr-only">Détail</span></th>
              </tr>
            </thead>
            <tbody>
              {commandes.map((commande) => {
                const annulee = commande.statut === 'ANNULEE'
                return (
                  <tr key={commande.id} className="border-b border-border last:border-b-0 hover:bg-tuile/40">
                    <td className="px-5 py-3">
                      <Link to={`/admin/commandes/${commande.id}`} className="font-medium text-primary hover:underline">n° {commande.id}</Link>
                      {commande.urgent && (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                          <Flame className="size-3" />
                          URGENT
                        </span>
                      )}
                      <span className="block text-xs text-muted-foreground">{commande.source === 'CLIENT' ? 'QR code client' : 'Saisie serveur'}</span>
                    </td>
                    <td className="px-5 py-3 text-marque-nuit">
                      Table {commande.table.numero}
                      {commande.places.length > 0 && (
                        <span className="block text-xs text-muted-foreground">place{commande.places.length > 1 ? 's' : ''} {commande.places.join(', ')}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-marque-nuit tabular-nums">{commande.articles}</td>
                    <td className={cn('px-5 py-3 text-right font-medium tabular-nums', annulee ? 'text-muted-foreground line-through' : 'text-marque-nuit')}>
                      {formaterPrix(commande.total)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground tabular-nums">{heureRestaurant.format(new Date(commande.creeLe))}</td>
                    <td className="px-5 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-sm font-semibold', COULEURS_STATUT[commande.statut])}>{LIBELLES_STATUT[commande.statut]}</span>
                    </td>
                    <td className="px-5 py-3">
                      {annulee ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={cn('rounded-md px-2.5 py-1 text-sm', commande.encaissee ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800')}>
                          {commande.encaissee ? 'Encaissée' : 'À encaisser'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/commandes/${commande.id}`}
                        aria-label={`Détail de la commande ${commande.id}`}
                        className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/15"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="flex flex-wrap justify-between gap-2 border-t border-border px-5 py-4 text-sm text-marque-nuit">
        <span>{commandes.length} commande{commandes.length > 1 ? 's' : ''}</span>
        <span className="font-semibold tabular-nums">Total : {formaterPrix(total)}</span>
      </p>
    </section>
  )
}
