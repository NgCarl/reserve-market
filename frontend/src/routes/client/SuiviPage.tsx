import { ArrowLeft, Bell, Check, ChefHat, ClipboardList, RefreshCw, Utensils } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useLoaderData, useLocation, useNavigate, useParams, useRevalidator } from 'react-router'
import { io, type Socket } from 'socket.io-client'
import { ActionsTable } from '@/components/menu/ActionsTable'
import { formaterPrix } from '@/lib/format'
import { LIBELLES_STATUT } from '@/lib/statut'
import { cn } from '@/lib/utils'
import type { CommandeSuivie, StatutCommande } from '@/types/commande'
import type { EvenementsTable } from '@/types/temps-reel'
import type { chargerCommande } from './commande.loader'

const ETAPES: { statut: StatutCommande; libelle: string; Icone: typeof Check }[] = [
  { statut: 'RECUE', libelle: 'Reçue', Icone: ClipboardList },
  { statut: 'EN_PREPARATION', libelle: 'En préparation', Icone: ChefHat },
  { statut: 'PRETE', libelle: 'Prête', Icone: Bell },
  { statut: 'SERVIE', libelle: 'Servie', Icone: Utensils },
]

const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Suivi d'une commande (maquette FoodScan « order details »). */
export function SuiviPage() {
  const { commande } = useLoaderData<typeof chargerCommande>()
  const { jeton = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { revalidate, state } = useRevalidator()
  const confirmee = (location.state as { confirmee?: boolean } | null)?.confirmee === true
  // Suivi en direct jusqu'au paiement : après « Servie », le client attend encore « Payée ».
  const terminee = commande.encaissee || commande.statut === 'ANNULEE'
  const rang = ETAPES.findIndex((etape) => etape.statut === commande.statut)
  const commandeId = commande.id

  // Dernière version de revalidate, sans recréer la connexion temps réel à chaque rendu.
  const revalider = useRef(revalidate)
  useEffect(() => {
    revalider.current = revalidate
  })

  useEffect(() => {
    if (terminee) return
    // Temps réel (§9) : le serveur prévient la table à chaque changement, la page relit alors la commande.
    const socket: Socket<EvenementsTable> = io({ auth: { jetonTable: jeton } })
    const relire = (miseAJour: CommandeSuivie) => {
      if (miseAJour.id === commandeId) void revalider.current()
    }
    // À chaque connexion, y compris après une coupure : un changement a pu être manqué (§7).
    socket.on('connect', () => void revalider.current())
    socket.on('commande:statut', relire)
    socket.on('commande:annulee', relire)
    return () => {
      socket.disconnect()
    }
  }, [terminee, jeton, commandeId])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-white px-4">
        <Link to={`/menu/${jeton}`} aria-label="Retour au menu" className="flex size-10 items-center justify-center rounded-full bg-tuile text-primary">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-marque-nuit">Ma commande</h1>
      </header>

      <main className="flex flex-col gap-5 p-4 pb-10">
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-marque-nuit">Commande n° <span className="text-primary">{commande.id}</span></p>
              <p className="text-sm text-muted-foreground">
                Envoyée à {heure.format(new Date(commande.creeLe))} · Table {commande.table.numero}
                {commande.chaise !== null && ` · Place ${commande.chaise}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void revalidate()}
              aria-label="Actualiser le suivi"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tuile text-primary"
            >
              <RefreshCw className={cn('size-5', state === 'loading' && 'animate-spin')} />
            </button>
          </div>

          {commande.statut === 'ANNULEE' ? (
            <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 font-semibold text-destructive">
              Cette commande a été annulée. Adressez-vous au serveur.
            </p>
          ) : (
            <ol className="mt-6 grid grid-cols-4" aria-label="Avancement de la commande">
              {ETAPES.map(({ statut, libelle, Icone }, index) => {
                const atteinte = index <= rang
                return (
                  <li key={statut} className="relative flex flex-col items-center gap-2 text-center" aria-current={index === rang ? 'step' : undefined}>
                    {index > 0 && (
                      <span aria-hidden="true" className={cn('absolute top-5 right-1/2 h-1 w-full -translate-y-1/2', atteinte ? 'bg-primary' : 'bg-tuile')} />
                    )}
                    <span
                      className={cn(
                        'relative z-10 flex size-10 items-center justify-center rounded-full border-2',
                        atteinte ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-muted-foreground',
                      )}
                    >
                      {index < rang ? <Check className="size-5" /> : <Icone className="size-5" />}
                    </span>
                    <span className={cn('text-xs leading-tight font-semibold', atteinte ? 'text-marque-nuit' : 'text-muted-foreground')}>{libelle}</span>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-lg font-bold text-marque-nuit">Détail</h2>
          <ul className="flex flex-col gap-3">
            {commande.lignes.map((ligne) => (
              <li key={ligne.id} className={cn('flex items-start gap-3', ligne.statut === 'ANNULEE' && 'opacity-50')}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-marque-nuit text-sm font-bold text-white">{ligne.quantite}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className={cn('leading-tight font-bold text-marque-nuit', ligne.statut === 'ANNULEE' && 'line-through')}>{ligne.nomPlat}</span>
                  {ligne.options.map((option) => (
                    <span key={option} className="text-sm text-muted-foreground">{option}</span>
                  ))}
                  {ligne.note && <span className="text-sm text-muted-foreground italic">« {ligne.note} »</span>}
                  <span className="text-xs font-semibold text-primary">{LIBELLES_STATUT[ligne.statut]}</span>
                </div>
                <span className="font-bold whitespace-nowrap text-marque-nuit">{formaterPrix(ligne.prixUnitaire * ligne.quantite)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-lg font-bold text-marque-nuit">Total</span>
            <span className="text-lg font-bold text-emerald-600">{formaterPrix(commande.total)}</span>
          </div>
        </section>

        {commande.encaissee ? (
          <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-4 font-semibold text-emerald-800">
            <Check className="size-5 shrink-0" />
            Commande payée. Merci et à bientôt !
          </p>
        ) : (
          commande.statut !== 'ANNULEE' && <ActionsTable jeton={jeton} />
        )}

        <Link to={`/menu/${jeton}`} className="flex h-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
          Commander autre chose
        </Link>
        <Link
          to={`/menu/${jeton}/commandes`}
          className="flex h-12 items-center justify-center rounded-full border-2 border-primary/20 font-semibold text-primary"
        >
          Toutes les commandes de la table
        </Link>
      </main>

      {confirmee && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-6" role="dialog" aria-modal="true" aria-labelledby="titre-confirmation">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-6 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="size-10" strokeWidth={3} />
            </span>
            <h2 id="titre-confirmation" className="text-2xl font-bold text-marque-nuit">Merci !</h2>
            <p className="text-muted-foreground">
              Votre commande n° {commande.id} est envoyée. Le serveur vous l'apporte dès qu'elle est prête.
            </p>
            <button
              type="button"
              // Efface l'état de navigation : un rechargement de la page ne réaffiche pas la confirmation.
              onClick={() => navigate(location.pathname, { replace: true, state: null })}
              className="h-14 w-full rounded-full bg-primary text-lg font-bold text-primary-foreground"
            >
              Suivre ma commande
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
