import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLoaderData } from 'react-router'
import { CarteCommande } from '@/components/cuisine/CarteCommande'
import { DialogueAnnulation, type ArticleAAnnuler } from '@/components/cuisine/DialogueAnnulation'
import { EnteteStaff } from '@/components/cuisine/EnteteStaff'
import { TableauArticles } from '@/components/cuisine/TableauArticles'
import { useCommandesCuisine } from '@/hooks/useCommandesCuisine'
import { useMaintenant } from '@/hooks/useMaintenant'
import { requeteApi } from '@/lib/api'
import { construireCartes, cumulerArticles, filtrerCartes, type CarteTable, type Filtre, type LigneCarte } from '@/lib/cuisine'
import { deverrouillerSon, jouerCarillon } from '@/lib/son'
import { cn } from '@/lib/utils'
import type { CommandeCuisine, Poste } from '@/types/cuisine'
import type { chargerCuisine } from './cuisine.loader'

const FILTRES: { valeur: Filtre; libelle: string }[] = [
  { valeur: 'TOUTES', libelle: 'Toutes' },
  { valeur: 'RECUE', libelle: 'Reçues' },
  { valeur: 'EN_PREPARATION', libelle: 'En préparation' },
  { valeur: 'PRETE', libelle: 'Prêtes' },
]

// Deux files distinctes dès l'arrivée (§10), à la place des colonnes « Dine-In » et « Takeaway » de FoodScan.
const POSTES: { poste: Poste; libelle: string }[] = [
  { poste: 'CUISINE', libelle: 'Cuisine' },
  { poste: 'BAR', libelle: 'Bar' },
]

const enJson = (method: string, corps: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corps),
})

/** Écran cuisine et bar (maquette FoodScan « K.D.S »), en temps réel. */
export function CuisinePage() {
  const { utilisateur, commandes: initiales } = useLoaderData<typeof chargerCuisine>()
  const [sonActive, setSonActive] = useState(false)
  const { commandes, connecte, erreur, setErreur, appliquer, gererErreur } = useCommandesCuisine(initiales, () => {
    if (sonActive) jouerCarillon()
  })
  const maintenant = useMaintenant()
  const [filtre, setFiltre] = useState<Filtre>('TOUTES')
  const [recherche, setRecherche] = useState('')
  const [carteOccupee, setCarteOccupee] = useState<string | null>(null)
  const [aAnnuler, setAAnnuler] = useState<ArticleAAnnuler | null>(null)

  const cartes = useMemo(() => construireCartes(commandes), [commandes])
  const visibles = useMemo(() => filtrerCartes(cartes, filtre, recherche), [cartes, filtre, recherche])
  const articles = useMemo(() => cumulerArticles(commandes), [commandes])

  const agir = async (carte: CarteTable, action: () => Promise<CommandeCuisine[]>) => {
    setCarteOccupee(carte.cle)
    setErreur(null)
    try {
      appliquer(await action())
    } catch (probleme) {
      gererErreur(probleme)
    } finally {
      setCarteOccupee(null)
    }
  }

  const changerStatut = (carte: CarteTable, statut: 'EN_PREPARATION' | 'PRETE', lignes: LigneCarte[]) => {
    void agir(carte, async () => {
      const corps = { ligneIds: lignes.map((ligne) => ligne.id), statut }
      return (await requeteApi<{ commandes: CommandeCuisine[] }>('/cuisine/lignes/statut', enJson('PATCH', corps))).commandes
    })
  }

  const basculerUrgence = (carte: CarteTable) => {
    void agir(carte, async () => {
      const corps = { commandeIds: carte.commandeIds, urgent: !carte.urgent }
      return (await requeteApi<{ commandes: CommandeCuisine[] }>('/cuisine/commandes/urgence', enJson('PATCH', corps))).commandes
    })
  }

  const annuler = async (motif: string) => {
    if (!aAnnuler) return
    try {
      const { commande } = await requeteApi<{ commande: CommandeCuisine }>(
        `/cuisine/lignes/${aAnnuler.ligne.id}/annulation`,
        enJson('POST', { motif }),
      )
      appliquer([commande])
    } catch (probleme) {
      gererErreur(probleme)
    }
    setAAnnuler(null)
  }

  const basculerSon = () => {
    if (sonActive) {
      setSonActive(false)
      return
    }
    // L'appui sur le bouton débloque le son du navigateur ; le carillon confirme qu'il est audible.
    deverrouillerSon().then(
      () => {
        setSonActive(true)
        jouerCarillon()
      },
      (probleme: unknown) => {
        console.error(probleme)
        setErreur("Le son n'a pas pu être activé sur cet appareil.")
      },
    )
  }

  return (
    <div className="min-h-dvh bg-[#f5f6fa]">
      <EnteteStaff utilisateur={utilisateur} connecte={connecte} sonActive={sonActive} onBasculerSon={basculerSon} />

      <div className="grid items-start gap-5 p-4 sm:p-5 md:grid-cols-[228px_minmax(0,1fr)] xl:grid-cols-[332px_minmax(0,1fr)]">
        <TableauArticles articles={articles} className="hidden md:block md:sticky md:top-[88px] md:max-h-[calc(100dvh-108px)] md:overflow-y-auto" />

        <main className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
            <div className="flex flex-wrap gap-3" role="group" aria-label="Filtrer par statut">
              {FILTRES.map(({ valeur, libelle }) => (
                <button
                  key={valeur}
                  type="button"
                  onClick={() => setFiltre(valeur)}
                  aria-pressed={filtre === valeur}
                  className={cn(
                    'h-11 rounded-lg border px-5 text-[15px] font-medium transition-colors sm:px-6',
                    filtre === valeur ? 'border-primary/15 bg-primary/10 text-primary' : 'border-border bg-white text-marque-nuit hover:bg-tuile',
                  )}
                >
                  {libelle}
                </button>
              ))}
            </div>
            <label className="relative w-full xl:ml-auto xl:w-[305px]">
              <span className="sr-only">Rechercher une commande</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={recherche}
                onChange={(evenement) => setRecherche(evenement.target.value)}
                placeholder="N° de commande, table ou plat"
                className="h-11 w-full rounded-lg border border-border bg-white pr-3 pl-10 text-[15px] outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
              />
            </label>
          </div>

          {erreur && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erreur}
              <button type="button" onClick={() => setErreur(null)} aria-label="Fermer le message" className="rounded-md p-1 hover:bg-red-100">
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="grid items-start gap-4 lg:grid-cols-2">
            {POSTES.map(({ poste, libelle }) => {
              const cartesDuPoste = visibles.filter((carte) => carte.poste === poste)
              return (
                <section key={poste} className="rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]" aria-label={libelle}>
                  <h2 className="flex items-center justify-between border-b border-border px-3.5 py-3 text-xl font-semibold text-marque-nuit">
                    {libelle}
                    {cartesDuPoste.length > 0 && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {cartesDuPoste.length} table{cartesDuPoste.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </h2>
                  {cartesDuPoste.length === 0 ? (
                    <p className="px-3.5 py-4 text-sm text-muted-foreground">Aucune commande.</p>
                  ) : (
                    <div className="flex flex-col gap-5 p-3">
                      {cartesDuPoste.map((carte) => (
                        <CarteCommande
                          key={carte.cle}
                          carte={carte}
                          maintenant={maintenant}
                          occupee={carteOccupee === carte.cle}
                          onStatut={changerStatut}
                          onUrgent={basculerUrgence}
                          onAnnuler={(ligne, carteLigne) => setAAnnuler({ ligne, carte: carteLigne })}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        </main>
      </div>

      <DialogueAnnulation key={aAnnuler?.ligne.id ?? 'aucun'} article={aAnnuler} onFermer={() => setAAnnuler(null)} onConfirmer={annuler} />
    </div>
  )
}
