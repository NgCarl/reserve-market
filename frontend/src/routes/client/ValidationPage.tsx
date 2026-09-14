import { ArrowLeft, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { SelecteurQuantite } from '@/components/menu/SelecteurQuantite'
import { useMenu } from '@/hooks/useMenu'
import { ErreurApi, requeteApi } from '@/lib/api'
import { formaterPrix } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCommandes } from '@/stores/commandes'
import { nombreArticles, totalPanier, usePanier } from '@/stores/panier'
import type { CommandeSuivie } from '@/types/commande'

interface ErreurEnvoi {
  message: string
  indisponibles: number[]
}

function indisponiblesDepuis(details: unknown): number[] {
  if (typeof details !== 'object' || details === null || !('indisponibles' in details) || !Array.isArray(details.indisponibles)) return []
  return details.indisponibles.filter((id): id is number => Number.isInteger(id))
}

/** Validation de la commande : place, récapitulatif, envoi (maquette FoodScan « checkout »). */
export function ValidationPage() {
  const menu = useMenu()
  const { jeton = '' } = useParams()
  const navigate = useNavigate()
  const lignes = usePanier((etat) => etat.lignes)
  const cleIdempotence = usePanier((etat) => etat.cleIdempotence)
  const changerQuantite = usePanier((etat) => etat.changerQuantite)
  const vider = usePanier((etat) => etat.vider)
  const memoriser = useCommandes((etat) => etat.memoriser)
  const [chaise, setChaise] = useState<number | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<ErreurEnvoi | null>(null)

  const total = totalPanier(lignes)
  const articles = nombreArticles(lignes)
  const chaises = Array.from({ length: menu.table.nombreChaises }, (_, index) => index + 1)
  const retourMenu = `/menu/${jeton}`

  const envoyer = async () => {
    if (chaise === null || enCours || lignes.length === 0) return
    setEnCours(true)
    setErreur(null)
    try {
      const { commande } = await requeteApi<{ commande: CommandeSuivie }>(`/menu/${encodeURIComponent(jeton)}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Aucun prix envoyé : le serveur recalcule tout.
        body: JSON.stringify({
          cleIdempotence,
          chaise,
          lignes: lignes.map((ligne) => ({
            platId: ligne.platId,
            quantite: ligne.quantite,
            optionIds: ligne.optionIds,
            extraIds: ligne.extraIds,
            note: ligne.note,
          })),
        }),
      })
      memoriser(jeton, commande.id)
      // Panier vidé une fois le suivi affiché, sinon « Votre panier est vide » apparaît pendant son chargement.
      // Si ce chargement échoue, un nouvel envoi garde la même clé et renvoie la même commande.
      await navigate(`/menu/${jeton}/commandes/${commande.id}`, { replace: true, state: { confirmee: true } })
      vider()
    } catch (probleme) {
      // Le panier et sa clé d'idempotence restent inchangés : réessayer ne crée jamais de doublon.
      setErreur(
        probleme instanceof ErreurApi
          ? { message: probleme.message, indisponibles: indisponiblesDepuis(probleme.details) }
          : { message: "L'envoi n'a pas abouti. Réessayez.", indisponibles: [] },
      )
      setEnCours(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-white px-4">
        <Link to={retourMenu} aria-label="Retour au menu" className="flex size-10 items-center justify-center rounded-full bg-tuile text-primary">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-marque-nuit">Valider ma commande</h1>
      </header>

      {lignes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-muted-foreground">Votre panier est vide.</p>
          <Link to={retourMenu} className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Voir la carte</Link>
        </div>
      ) : (
        <main className="flex flex-1 flex-col gap-5 p-4 pb-40">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-lg font-bold text-marque-nuit">Table {menu.table.numero}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choisissez votre place : le serveur saura à qui apporter chaque plat.</p>
            <div className="mt-4 grid grid-cols-4 gap-3" role="radiogroup" aria-label="Votre place">
              {chaises.map((numero) => (
                <button
                  key={numero}
                  type="button"
                  role="radio"
                  aria-checked={chaise === numero}
                  onClick={() => setChaise(numero)}
                  className={cn(
                    'flex h-14 items-center justify-center rounded-2xl border-2 text-lg font-bold transition-colors',
                    chaise === numero ? 'border-primary bg-primary text-primary-foreground' : 'border-transparent bg-tuile text-marque-nuit',
                  )}
                >
                  {numero}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-lg font-bold text-marque-nuit">
              Récapitulatif · {articles} article{articles > 1 ? 's' : ''}
            </h2>
            <ul className="flex flex-col gap-4">
              {lignes.map((ligne) => {
                const indisponible = erreur?.indisponibles.includes(ligne.platId) ?? false
                return (
                  <li key={ligne.cle} className={cn('flex flex-col gap-2 rounded-xl', indisponible && 'bg-destructive/5 p-2 ring-2 ring-destructive/40')}>
                    <div className="flex items-center gap-3">
                      {ligne.photoUrl && (
                        <img src={ligne.photoUrl} alt="" width={56} height={56} loading="lazy" className="size-14 shrink-0 rounded-xl object-cover" />
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="leading-tight font-bold text-marque-nuit">{ligne.nom}</span>
                        {ligne.choix.map((choix) => (
                          <span key={choix.libelle} className="text-sm text-muted-foreground">{choix.libelle}</span>
                        ))}
                        {ligne.note && <span className="text-sm text-muted-foreground italic">« {ligne.note} »</span>}
                        <span className="font-bold text-marque-nuit">{formaterPrix(ligne.prixUnitaire * ligne.quantite)}</span>
                      </div>
                      <SelecteurQuantite quantite={ligne.quantite} onChange={(quantite) => changerQuantite(ligne.cle, quantite)} min={0} libelle={ligne.nom} />
                    </div>
                    {indisponible && <p className="text-sm font-semibold text-destructive">Plus disponible : retirez cet article pour continuer.</p>}
                  </li>
                )
              })}
            </ul>
          </section>

          <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <Wallet className="size-4 shrink-0" />
            Vous réglez à table, auprès du serveur, après votre repas.
          </p>
        </main>
      )}

      {lignes.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md flex-col gap-3 border-t border-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {erreur && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{erreur.message}</p>
          )}
          <div className="flex items-center justify-between px-1">
            <span className="text-lg font-bold text-marque-nuit">Total</span>
            <span className="text-lg font-bold text-emerald-600">{formaterPrix(total)}</span>
          </div>
          <button
            type="button"
            onClick={() => void envoyer()}
            // Désactivé pendant l'envoi : avec la clé d'idempotence, aucun double appui ne crée de doublon (§6).
            disabled={chaise === null || enCours}
            className="h-14 w-full rounded-full bg-primary text-lg font-bold text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {enCours ? 'Envoi en cours…' : chaise === null ? 'Choisissez votre place' : `Envoyer la commande · ${formaterPrix(total)}`}
          </button>
        </div>
      )}
    </div>
  )
}
