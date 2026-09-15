import { ArrowLeft, CalendarClock, Flame, MapPin, ShoppingBag, Smartphone, UserRound } from 'lucide-react'
import { useLoaderData, useNavigate } from 'react-router'
import { PastillePoste } from '@/components/admin/PastillePoste'
import { formaterPrix } from '@/lib/format'
import { dateLongue, heureRestaurant, jourRestaurant } from '@/lib/journee'
import { COULEURS_STATUT, LIBELLES_STATUT } from '@/lib/statut'
import { cn } from '@/lib/utils'
import type { CommandeAdmin, LigneAdmin, ModePaiement } from '@/types/gestion'
import type { chargerCommandeAdmin } from './admin.loader'

const MODES: Record<ModePaiement, string> = { ESPECES: 'Espèces', MOBILE_MONEY: 'Mobile Money' }

const heure = (iso: string): string => heureRestaurant.format(new Date(iso))

/** Parcours d'un article : reçu, en préparation, prêt, servi, avec les heures connues. */
function parcours(commande: CommandeAdmin, ligne: LigneAdmin): string {
  const etapes = [`Reçu ${heure(commande.creeLe)}`]
  if (ligne.preparationLe) etapes.push(`en préparation ${heure(ligne.preparationLe)}`)
  if (ligne.preteLe) etapes.push(`prêt ${heure(ligne.preteLe)}`)
  if (ligne.servieLe) etapes.push(`servi ${heure(ligne.servieLe)}${ligne.servieParNom ? ` par ${ligne.servieParNom}` : ''}`)
  return etapes.join(' · ')
}

/** Détail d'une commande (maquette FoodScan « Table Orders / View »), en lecture seule : pas d'acceptation manuelle (§6). */
export function CommandePage() {
  const { commande } = useLoaderData<typeof chargerCommandeAdmin>()
  const navigate = useNavigate()
  const encaissee = commande.paiement.encaisseeLe !== null
  const sousTotal = commande.lignes.reduce((total, ligne) => total + ligne.prixUnitaire * ligne.quantite, 0)
  const montantAnnule = sousTotal - commande.total

  const retour = () => {
    // Retour à la liste telle qu'elle était (filtres compris) ; ouverte directement, la page ramène à la liste du jour.
    const historique = window.history.state as { idx?: number } | null
    if (historique?.idx) {
      void navigate(-1)
    } else {
      void navigate('/admin/commandes')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={retour} aria-label="Retour aux commandes" className="flex size-10 items-center justify-center rounded-full bg-tuile text-primary">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-2xl font-medium text-marque-nuit">
            Commande n° <span className="text-primary">{commande.id}</span>
          </h1>
          <span className={cn('rounded-full px-2.5 py-0.5 text-sm font-semibold', COULEURS_STATUT[commande.statut])}>{LIBELLES_STATUT[commande.statut]}</span>
          {commande.statut !== 'ANNULEE' && (
            <span className={cn('rounded-full px-2.5 py-0.5 text-sm font-semibold', encaissee ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700')}>
              {encaissee ? 'Encaissée' : 'Non encaissée'}
            </span>
          )}
          {commande.urgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-sm font-semibold text-white">
              <Flame className="size-3.5" />
              Urgent
            </span>
          )}
        </div>

        <dl className="mt-4 grid gap-x-8 gap-y-2.5 text-sm text-marque-nuit sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
            <dt className="sr-only">Date</dt>
            <dd className="first-letter:uppercase">{dateLongue(jourRestaurant(new Date(commande.creeLe)))} à {heure(commande.creeLe)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <dt className="sr-only">Table</dt>
            <dd>
              Table {commande.table.numero}
              {commande.places.length > 0 && ` · place${commande.places.length > 1 ? 's' : ''} ${commande.places.join(', ')}`}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            {commande.source === 'CLIENT' ? <Smartphone className="size-4 shrink-0 text-muted-foreground" /> : <UserRound className="size-4 shrink-0 text-muted-foreground" />}
            <dt className="sr-only">Origine</dt>
            <dd>{commande.source === 'CLIENT' ? 'Commandée par le client (QR code)' : `Saisie par ${commande.saisiePar ?? 'un serveur'}`}</dd>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 shrink-0 text-muted-foreground" />
            <dt className="sr-only">Articles</dt>
            <dd>{commande.articles} article{commande.articles > 1 ? 's' : ''}</dd>
          </div>
        </dl>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
          <h2 className="border-b border-border px-5 py-4 text-lg font-medium text-marque-nuit">Détail de la commande</h2>
          <ul className="divide-y divide-border">
            {commande.lignes.map((ligne) => {
              const annulee = ligne.statut === 'ANNULEE'
              return (
                <li key={ligne.id} className="flex gap-3 px-5 py-4">
                  <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white', annulee ? 'bg-muted-foreground' : 'bg-marque-nuit')}>
                    {ligne.quantite}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn('font-medium text-marque-nuit', annulee && 'text-muted-foreground line-through')}>{ligne.nomPlat}</p>
                      <PastillePoste poste={ligne.poste} />
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', COULEURS_STATUT[ligne.statut])}>{LIBELLES_STATUT[ligne.statut]}</span>
                    </div>
                    {ligne.options.map((option) => (
                      <p key={option.libelle} className="text-sm text-muted-foreground">
                        {option.libelle}
                        {option.prix > 0 && ` (+ ${formaterPrix(option.prix)})`}
                      </p>
                    ))}
                    {ligne.note && (
                      <p className="text-sm">
                        <span className="text-marque-nuit/80">Instruction :</span> <span className="font-medium text-marque-nuit">{ligne.note}</span>
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ligne.chaise !== null && `Place ${ligne.chaise} · `}
                      {parcours(commande, ligne)}
                    </p>
                    {annulee && (
                      <p className="mt-1 text-sm text-red-700">
                        Annulé{ligne.annuleeLe && ` à ${heure(ligne.annuleeLe)}`}{ligne.annuleeParNom && ` par ${ligne.annuleeParNom}`}
                        {ligne.motifAnnulation && ` : ${ligne.motifAnnulation}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className={cn('font-medium tabular-nums', annulee ? 'text-muted-foreground line-through' : 'text-marque-nuit')}>
                      {formaterPrix(ligne.prixUnitaire * ligne.quantite)}
                    </p>
                    {ligne.quantite > 1 && <p className="text-xs text-muted-foreground tabular-nums">{ligne.quantite} × {formaterPrix(ligne.prixUnitaire)}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
            <h2 className="mb-3 text-lg font-medium text-marque-nuit">Total</h2>
            <dl className="flex flex-col gap-2 text-[15px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Sous-total</dt>
                <dd className="text-marque-nuit tabular-nums">{formaterPrix(sousTotal)}</dd>
              </div>
              {montantAnnule > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Articles annulés</dt>
                  <dd className="text-red-700 tabular-nums">− {formaterPrix(montantAnnule)}</dd>
                </div>
              )}
              <div className="mt-1 flex justify-between gap-3 border-t border-border pt-3 text-lg font-semibold">
                <dt className="text-marque-nuit">Total</dt>
                <dd className="text-emerald-700 tabular-nums">{formaterPrix(commande.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
            <h2 className="mb-3 text-lg font-medium text-marque-nuit">Paiement</h2>
            <dl className="flex flex-col gap-2 text-[15px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Mode</dt>
                <dd className="text-marque-nuit">{commande.paiement.mode ? MODES[commande.paiement.mode] : 'Pas encore indiqué'}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Encaissement</dt>
                <dd className={encaissee ? 'text-emerald-700' : 'text-marque-nuit'}>
                  {encaissee && commande.paiement.encaisseeLe
                    ? `Encaissée à ${heure(commande.paiement.encaisseeLe)}${commande.paiement.encaisseePar ? ` par ${commande.paiement.encaisseePar}` : ''}`
                    : "Pas encore encaissée. Le serveur l'enregistre quand il reçoit l'argent."}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
