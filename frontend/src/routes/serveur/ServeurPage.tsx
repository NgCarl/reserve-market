import { Banknote, Bell, Check, CheckCheck, ChevronDown, CirclePlus, Receipt, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData, useLocation, useNavigate } from 'react-router'
import { BandeauHorsLigne } from '@/components/BandeauHorsLigne'
import { EnteteStaff } from '@/components/cuisine/EnteteStaff'
import { DialogueEncaissement, type CibleEncaissement } from '@/components/serveur/DialogueEncaissement'
import { DialogueMotif } from '@/components/serveur/DialogueMotif'
import { useMaintenant } from '@/hooks/useMaintenant'
import { useSalle } from '@/hooks/useSalle'
import { ErreurApi, enJson, messageErreur, requeteApi } from '@/lib/api'
import { formaterPrix } from '@/lib/format'
import { LIBELLES_PAIEMENT } from '@/lib/paiement'
import { deverrouillerSon, jouerCarillon } from '@/lib/son'
import { COULEURS_STATUT, LIBELLES_STATUT } from '@/lib/statut'
import { cn } from '@/lib/utils'
import type { AppelSalle, LigneSalle } from '@/types/salle'
import type { chargerServeur } from './serveur.loader'

type Onglet = 'servir' | 'tables'

function Article({ ligne }: { ligne: LigneSalle }) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-marque-nuit text-sm font-bold text-white">{ligne.quantite}</span>
      <div className="min-w-0">
        <p className="leading-snug font-semibold text-marque-nuit">
          {ligne.nomPlat}
          {ligne.chaise !== null && <span className="ml-1.5 text-xs font-normal text-muted-foreground">place {ligne.chaise}</span>}
        </p>
        {ligne.options.map((option) => (
          <p key={option} className="text-xs text-muted-foreground">{option}</p>
        ))}
        {ligne.note && (
          <p className="text-xs">
            <span className="text-marque-nuit/80">Instruction :</span> <span className="font-medium text-marque-nuit">{ligne.note}</span>
          </p>
        )}
      </div>
    </div>
  )
}

/** Téléphone du serveur (§7) : appels des tables, plats prêts à servir, tables à encaisser, nouvelle commande. */
export function ServeurPage() {
  const ecran = useLoaderData<typeof chargerServeur>()
  const { utilisateur } = ecran
  const location = useLocation()
  const navigate = useNavigate()
  const [sonActive, setSonActive] = useState(false)
  const { salle, connecte, coupure, recuLe, erreur, setErreur, recharger } = useSalle(ecran, () => {
    if (sonActive) jouerCarillon()
  })
  const maintenant = useMaintenant()
  const [onglet, setOnglet] = useState<Onglet>('servir')
  const [occupe, setOccupe] = useState<string | null>(null)
  const [aEncaisser, setAEncaisser] = useState<CibleEncaissement | null>(null)
  const [aAnnuler, setAAnnuler] = useState<{ ligne: LigneSalle; numero: number } | null>(null)
  const [ouvertes, setOuvertes] = useState<number[]>([])
  const [info, setInfo] = useState<string | null>((location.state as { message?: string } | null)?.message ?? null)

  const tablesAServir = salle.tables.filter((entree) => entree.aServir.length > 0)
  const nombreAServir = tablesAServir.reduce((total, entree) => total + entree.aServir.length, 0)

  const agir = async (cle: string, action: () => Promise<unknown>) => {
    setOccupe(cle)
    setErreur(null)
    try {
      await action()
      await recharger()
    } catch (probleme) {
      if (probleme instanceof ErreurApi && probleme.status === 401) {
        void navigate(`/connexion?retour=${encodeURIComponent('/serveur')}`, { replace: true })
        return
      }
      setErreur(messageErreur(probleme, 'Action impossible. Réessayez.'))
      // 409 : un collègue est passé avant ; on affiche l'état réel.
      if (probleme instanceof ErreurApi && probleme.status === 409) await recharger()
    } finally {
      setOccupe(null)
    }
  }

  const servir = (cle: string, ligneIds: number[]) => {
    void agir(cle, () => requeteApi('/serveur/lignes/servies', enJson('PATCH', { ligneIds })))
  }
  const traiter = (appel: AppelSalle) => {
    void agir(`appel-${appel.id}`, () => requeteApi(`/serveur/appels/${appel.id}/traite`, { method: 'PATCH' }))
  }

  const basculerSon = () => {
    if (sonActive) {
      setSonActive(false)
      return
    }
    deverrouillerSon().then(
      () => {
        setSonActive(true)
        jouerCarillon()
      },
      (probleme: unknown) => {
        console.error(probleme)
        setErreur("Le son n'a pas pu être activé sur ce téléphone.")
      },
    )
  }

  return (
    <div className="min-h-dvh bg-[#f5f6fa]">
      <EnteteStaff
        utilisateur={utilisateur}
        connecte={connecte}
        sonActive={sonActive}
        onBasculerSon={basculerSon}
        lienBackOffice={utilisateur.role === 'ADMIN'}
      />

      <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pb-10">
        {coupure && <BandeauHorsLigne recuLe={recuLe} />}
        {info && (
          <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 font-medium text-emerald-800">
            <Check className="size-5 shrink-0" />
            <span className="flex-1">{info}</span>
            <button type="button" onClick={() => setInfo(null)} aria-label="Fermer le message" className="rounded-md p-1 hover:bg-emerald-100">
              <X className="size-4" />
            </button>
          </p>
        )}
        {erreur && (
          <p role="alert" className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <span className="flex-1">{erreur}</span>
            <button type="button" onClick={() => setErreur(null)} aria-label="Fermer le message" className="rounded-md p-1 hover:bg-red-100">
              <X className="size-4" />
            </button>
          </p>
        )}

        {salle.appels.length > 0 && (
          <section aria-label="Appels des tables" className="flex flex-col gap-3">
            {salle.appels.map((appel) => {
              const addition = appel.type === 'ADDITION'
              const entree = salle.tables.find((candidate) => candidate.table.id === appel.table.id)
              const minutes = Math.max(0, Math.floor((maintenant - Date.parse(appel.creeLe)) / 60_000))
              return (
                <div
                  key={appel.id}
                  className={cn('flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4', addition ? 'border-primary/30 bg-primary/5' : 'border-amber-300 bg-amber-50')}
                >
                  <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full text-white', addition ? 'bg-primary' : 'bg-amber-500')}>
                    {addition ? <Receipt className="size-5" /> : <Bell className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-marque-nuit">Table {appel.table.numero}</p>
                    <p className="text-sm text-marque-nuit/80">
                      {addition
                        ? `Demande l'addition · ${appel.modePaiement ? LIBELLES_PAIEMENT[appel.modePaiement] : ''}${appel.montant !== null ? ` · ${formaterPrix(appel.montant)}` : ''}`
                        : 'Appelle le serveur'}
                      {` · ${minutes === 0 ? "à l'instant" : `il y a ${minutes} min`}`}
                    </p>
                  </div>
                  {addition && entree ? (
                    <button
                      type="button"
                      onClick={() => setAEncaisser({ table: entree, mode: appel.modePaiement })}
                      className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground"
                    >
                      Encaisser
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={occupe === `appel-${appel.id}`}
                      onClick={() => traiter(appel)}
                      className="h-11 rounded-full bg-marque-nuit px-5 font-semibold text-white disabled:opacity-50"
                    >
                      J'y vais
                    </button>
                  )}
                </div>
              )
            })}
          </section>
        )}

        <Link to="/serveur/commande" className="flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-[0_8px_24px_rgba(21,86,167,0.25)]">
          <CirclePlus className="size-5" />
          Nouvelle commande
        </Link>

        <div role="tablist" aria-label="Service" className="grid grid-cols-2 rounded-full bg-white p-1 ring-1 ring-border">
          <button
            type="button"
            role="tab"
            aria-selected={onglet === 'servir'}
            onClick={() => setOnglet('servir')}
            className={cn('flex h-11 items-center justify-center gap-2 rounded-full font-semibold', onglet === 'servir' ? 'bg-primary text-primary-foreground' : 'text-marque-nuit')}
          >
            À servir
            {nombreAServir > 0 && (
              <span className={cn('rounded-full px-2 text-sm', onglet === 'servir' ? 'bg-white text-primary' : 'bg-emerald-700 text-white')}>{nombreAServir}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={onglet === 'tables'}
            onClick={() => setOnglet('tables')}
            className={cn('flex h-11 items-center justify-center gap-2 rounded-full font-semibold', onglet === 'tables' ? 'bg-primary text-primary-foreground' : 'text-marque-nuit')}
          >
            Tables ({salle.tables.filter((entree) => entree.commandeIds.length > 0).length})
          </button>
        </div>

        {onglet === 'servir' && (tablesAServir.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center text-muted-foreground">
            Rien à servir pour le moment. Les plats prêts en cuisine et au bar apparaissent ici.
          </p>
        ) : (
          tablesAServir.map((entree) => (
            <section key={entree.table.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-border">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-lg font-bold text-marque-nuit">Table {entree.table.numero}</h2>
                {entree.aServir.length > 1 && (
                  <button
                    type="button"
                    disabled={occupe !== null}
                    onClick={() => servir(`table-${entree.table.id}`, entree.aServir.map((ligne) => ligne.id))}
                    className="flex h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <CheckCheck className="size-4" />
                    Tout servir
                  </button>
                )}
              </div>
              <ul className="divide-y divide-border">
                {entree.aServir.map((ligne) => (
                  <li key={ligne.id} className="flex items-center gap-3 px-4 py-3">
                    <Article ligne={ligne} />
                    <button
                      type="button"
                      disabled={occupe !== null}
                      onClick={() => servir(`ligne-${ligne.id}`, [ligne.id])}
                      className="h-10 shrink-0 rounded-full border-2 border-emerald-700 px-4 text-sm font-semibold text-emerald-700 disabled:opacity-50"
                    >
                      Servi
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ))}

        {onglet === 'tables' && (salle.tables.every((entree) => entree.commandeIds.length === 0) ? (
          <p className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center text-muted-foreground">Aucune table en cours.</p>
        ) : (
          salle.tables.filter((entree) => entree.commandeIds.length > 0).map((entree) => {
            const ouverte = ouvertes.includes(entree.table.id)
            const lignes = [...entree.aServir, ...entree.enCours, ...entree.servies].sort((a, b) => a.id - b.id)
            return (
              <section key={entree.table.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-border">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-marque-nuit">Table {entree.table.numero}</h2>
                    <p className="text-sm text-muted-foreground">
                      {entree.enCours.length} en cours · {entree.aServir.length} prêt{entree.aServir.length > 1 ? 's' : ''} · {entree.servies.length} servi{entree.servies.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-lg font-bold whitespace-nowrap text-emerald-700 tabular-nums">{formaterPrix(entree.total)}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border px-4 py-3">
                  <button
                    type="button"
                    aria-expanded={ouverte}
                    onClick={() => setOuvertes((liste) => (ouverte ? liste.filter((id) => id !== entree.table.id) : [...liste, entree.table.id]))}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-border px-2 text-sm font-semibold text-marque-nuit"
                  >
                    <ChevronDown className={cn('size-4 shrink-0 transition-transform', ouverte && 'rotate-180')} />
                    Détail
                  </button>
                  <Link
                    to={`/serveur/commande?table=${entree.table.id}`}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-border px-2 text-sm font-semibold text-primary"
                  >
                    <CirclePlus className="size-4 shrink-0" />
                    Ajouter
                  </Link>
                  <button
                    type="button"
                    onClick={() => setAEncaisser({ table: entree, mode: entree.appels.find((appel) => appel.type === 'ADDITION')?.modePaiement ?? null })}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-2 text-sm font-semibold text-primary-foreground"
                  >
                    <Banknote className="size-4 shrink-0" />
                    Encaisser
                  </button>
                </div>
                {ouverte && (
                  <ul className="divide-y divide-border border-t border-border">
                    {lignes.map((ligne) => (
                      <li key={ligne.id} className="flex items-center gap-2 px-4 py-3">
                        <Article ligne={ligne} />
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', COULEURS_STATUT[ligne.statut])}>{LIBELLES_STATUT[ligne.statut]}</span>
                        {ligne.statut === 'RECUE' && (
                          <button
                            type="button"
                            onClick={() => setAAnnuler({ ligne, numero: entree.table.numero })}
                            aria-label={`Annuler ${ligne.nomPlat}`}
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })
        ))}
      </main>

      <DialogueEncaissement
        key={aEncaisser?.table.table.id ?? 'aucune'}
        cible={aEncaisser}
        numeros={salle.restaurant}
        onFermer={() => setAEncaisser(null)}
        onEncaisse={(message) => {
          setAEncaisser(null)
          setInfo(message)
          void recharger()
        }}
      />

      <DialogueMotif
        key={aAnnuler?.ligne.id ?? 'aucun'}
        ouvert={aAnnuler !== null}
        titre="Annuler un article"
        description={aAnnuler ? `${aAnnuler.ligne.quantite}x ${aAnnuler.ligne.nomPlat} · Table ${aAnnuler.numero}. Possible tant que la préparation n'a pas commencé.` : ''}
        onConfirmer={async (motif) => {
          if (!aAnnuler) return
          await requeteApi(`/serveur/lignes/${aAnnuler.ligne.id}/annulation`, enJson('POST', { motif }))
          setAAnnuler(null)
          await recharger()
        }}
        onFermer={() => setAAnnuler(null)}
      />
    </div>
  )
}
