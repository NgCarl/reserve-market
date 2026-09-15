import { ChefHat, ChevronRight, ClipboardList, TrendingUp, Wallet } from 'lucide-react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import { ChoixJour } from '@/components/admin/ChoixJour'
import { useAdmin } from '@/hooks/useAdmin'
import { formaterPrix } from '@/lib/format'
import { dateLongue, heureActuelleRestaurant, heureRestaurant, jourRestaurant } from '@/lib/journee'
import { COULEURS_STATUT, LIBELLES_STATUT } from '@/lib/statut'
import { cn } from '@/lib/utils'
import type { chargerTableauDeBord } from './admin.loader'

/** Tableau de bord (maquette FoodScan « Dashboard ») : les chiffres d'une journée, sans graphique (hors v1). */
export function TableauDeBordPage() {
  const donnees = useLoaderData<typeof chargerTableauDeBord>()
  const utilisateur = useAdmin()
  const [, setParametres] = useSearchParams()
  const aujourdhui = donnees.jour === jourRestaurant()
  const suffixeJour = aujourdhui ? '' : `?date=${donnees.jour}`

  // Tuiles FoodScan : fond coloré, texte blanc (contraste ≥ 4,5:1 sur chaque fond), pastille d'icône blanche.
  const tuiles = [
    {
      libelle: aujourdhui ? 'Commandes du jour' : 'Commandes',
      valeur: String(donnees.commandes),
      detail: donnees.commandes > 0 ? `Panier moyen ${formaterPrix(donnees.panierMoyen)}` : 'Aucune commande',
      Icone: ClipboardList,
      fond: 'bg-primary',
      icone: 'text-primary',
      lien: `/admin/commandes${suffixeJour}`,
    },
    {
      libelle: "Chiffre d'affaires",
      valeur: formaterPrix(donnees.chiffreAffaires),
      detail: 'Commandes passées, hors annulations',
      Icone: TrendingUp,
      fond: 'bg-emerald-700',
      icone: 'text-emerald-700',
      lien: `/admin/commandes${suffixeJour}`,
    },
    {
      libelle: 'Total encaissé',
      valeur: formaterPrix(donnees.totalEncaisse),
      detail: 'Argent reçu, confirmé par les serveurs',
      Icone: Wallet,
      fond: 'bg-marque-nuit',
      icone: 'text-marque-nuit',
      lien: `/admin/commandes${suffixeJour}`,
    },
    {
      libelle: 'Commandes en cours',
      valeur: String(donnees.enCours),
      detail: 'Reçues, en préparation ou prêtes',
      Icone: ChefHat,
      fond: 'bg-violet-700',
      icone: 'text-violet-700',
      lien: aujourdhui ? '/cuisine' : `/admin/commandes${suffixeJour}`,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-2xl font-semibold text-primary">{heureActuelleRestaurant() < 18 ? 'Bonjour' : 'Bonsoir'} !</p>
        <p className="text-lg text-marque-nuit">{utilisateur.nom}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-marque-nuit first-letter:uppercase">
          {aujourdhui ? "Aujourd'hui" : dateLongue(donnees.jour)}
          {aujourdhui && <span className="ml-2 text-base font-normal text-muted-foreground">{dateLongue(donnees.jour)}</span>}
        </h1>
        <ChoixJour jour={donnees.jour} onChange={(jour) => setParametres(jour ? { date: jour } : {}, { replace: true })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tuiles.map(({ libelle, valeur, detail, Icone, fond, icone, lien }) => (
          <Link
            key={libelle}
            to={lien}
            // min-w-0 : dans une grille, une tuile ne rétrécit pas sous la largeur de son contenu sans cela (débordement sur téléphone).
            className={cn('flex min-w-0 items-center gap-4 rounded-xl p-5 text-white transition-transform hover:-translate-y-0.5', fond)}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white">
              <Icone className={cn('size-6', icone)} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-medium">{libelle}</span>
              <span className="block truncate text-2xl font-semibold">{valeur}</span>
              <span className="block text-xs text-white/85">{detail}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="min-w-0 rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
          <h2 className="border-b border-border px-5 py-4 text-lg font-medium text-marque-nuit">Plats les plus commandés</h2>
          {donnees.platsPopulaires.length === 0 ? (
            <p className="px-5 py-8 text-center text-muted-foreground">Aucun plat commandé {aujourdhui ? "pour l'instant" : 'ce jour-là'}.</p>
          ) : (
            <ol className="divide-y divide-border">
              {donnees.platsPopulaires.map((plat, index) => (
                <li key={plat.nomPlat} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tuile text-sm font-semibold text-marque-nuit">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-marque-nuit">{plat.nomPlat}</span>
                  <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground tabular-nums">{formaterPrix(plat.montant)}</span>
                  <span className="w-10 shrink-0 text-right font-semibold whitespace-nowrap text-marque-nuit tabular-nums sm:w-16">× {plat.quantite}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="min-w-0 rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="text-lg font-medium text-marque-nuit">Dernières commandes</h2>
            <Link to={`/admin/commandes${suffixeJour}`} className="text-sm font-semibold text-primary hover:underline">Tout voir</Link>
          </div>
          {donnees.dernieresCommandes.length === 0 ? (
            <p className="px-5 py-8 text-center text-muted-foreground">Aucune commande {aujourdhui ? "pour l'instant" : 'ce jour-là'}.</p>
          ) : (
            <ul className="divide-y divide-border">
              {donnees.dernieresCommandes.map((commande) => (
                <li key={commande.id}>
                  <Link to={`/admin/commandes/${commande.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-tuile/60">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-marque-nuit">
                        n° {commande.id} · Table {commande.table.numero}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {heureRestaurant.format(new Date(commande.creeLe))} · {commande.articles} article{commande.articles > 1 ? 's' : ''}
                      </span>
                    </span>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', COULEURS_STATUT[commande.statut])}>
                      {LIBELLES_STATUT[commande.statut]}
                    </span>
                    <span className="shrink-0 text-right font-semibold whitespace-nowrap text-marque-nuit tabular-nums sm:w-24">{formaterPrix(commande.total)}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
