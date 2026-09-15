import { ArrowLeft, Plus, Search, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { BandeauHorsLigne } from '@/components/BandeauHorsLigne'
import { FichePlat } from '@/components/menu/FichePlat'
import { SelecteurQuantite } from '@/components/menu/SelecteurQuantite'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { ErreurApi, enJson, messageErreur, requeteApi } from '@/lib/api'
import { formaterPrix } from '@/lib/format'
import { normaliser } from '@/lib/texte'
import { cn } from '@/lib/utils'
import { genererUuid } from '@/lib/uuid'
import type { LignePanier, NouvelleLigne } from '@/stores/panier'
import type { CommandeSuivie } from '@/types/commande'
import type { PlatMenu } from '@/types/menu'
import type { chargerSaisie } from './serveur.loader'

/** Même article, mêmes choix, même instruction : une seule ligne dont la quantité augmente. */
const cleLigne = (ligne: NouvelleLigne): string =>
  JSON.stringify([ligne.platId, [...ligne.optionIds].sort((a, b) => a - b), [...ligne.extraIds].sort((a, b) => a - b), ligne.note])

const aDesChoix = (plat: PlatMenu): boolean => plat.groupesVariantes.length > 0 || plat.extras.length > 0 || plat.addons.length > 0

const puce = (actif: boolean) =>
  cn('h-10 shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap', actif ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-marque-nuit')

/** Saisie serveur (§7) : commande pour un client sans téléphone, depuis le téléphone du serveur. */
export function SaisiePage() {
  const { donnees: menu, horsLigne, recuLe } = useLoaderData<typeof chargerSaisie>()
  const navigate = useNavigate()
  const [parametres] = useSearchParams()
  const [tableId, setTableId] = useState<number | null>(menu.tables.find((table) => String(table.id) === parametres.get('table'))?.id ?? null)
  const [chaise, setChaise] = useState<number | null>(null)
  const [lignes, setLignes] = useState<LignePanier[]>([])
  // Clé d'idempotence (§6) : un renvoi après une coupure réseau ne crée pas de seconde commande.
  const [cleIdempotence] = useState(genererUuid)
  const [recherche, setRecherche] = useState('')
  const [categorieId, setCategorieId] = useState<number | null>(null)
  const [platOuvert, setPlatOuvert] = useState<PlatMenu | null>(null)
  const [recapOuvert, setRecapOuvert] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const table = menu.tables.find((candidate) => candidate.id === tableId) ?? null
  const articles = lignes.reduce((total, ligne) => total + ligne.quantite, 0)
  const total = lignes.reduce((somme, ligne) => somme + ligne.prixUnitaire * ligne.quantite, 0)

  const plats = useMemo(() => {
    const terme = normaliser(recherche)
    return menu.categories
      .filter((categorie) => categorieId === null || categorie.id === categorieId)
      .flatMap((categorie) => categorie.plats.map((plat) => ({ plat, categorie: categorie.nom })))
      .filter(({ plat }) => !terme || normaliser(plat.nom).includes(terme))
  }, [menu.categories, categorieId, recherche])

  const ajouter = (nouvelle: NouvelleLigne) => {
    const cle = cleLigne(nouvelle)
    setLignes((liste) => (liste.some((ligne) => ligne.cle === cle)
      ? liste.map((ligne) => (ligne.cle === cle ? { ...ligne, quantite: ligne.quantite + nouvelle.quantite } : ligne))
      : [...liste, { ...nouvelle, cle }]))
  }

  const changerQuantite = (cle: string, quantite: number) =>
    setLignes((liste) => (quantite <= 0 ? liste.filter((ligne) => ligne.cle !== cle) : liste.map((ligne) => (ligne.cle === cle ? { ...ligne, quantite } : ligne))))

  // Article sans choix : ajouté d'un appui. Sinon, la fiche s'ouvre pour la taille, l'accompagnement, la note…
  const ajoutRapide = (plat: PlatMenu) => {
    if (aDesChoix(plat)) {
      setPlatOuvert(plat)
      return
    }
    ajouter({ platId: plat.id, nom: plat.nom, optionIds: [], extraIds: [], choix: [], note: '', photoUrl: null, prixUnitaire: plat.prix, quantite: 1 })
  }

  const envoyer = async () => {
    if (!table || lignes.length === 0 || enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      const { commande } = await requeteApi<{ commande: CommandeSuivie }>('/serveur/commandes', enJson('POST', {
        tableId: table.id,
        chaise,
        cleIdempotence,
        lignes: lignes.map((ligne) => ({ platId: ligne.platId, quantite: ligne.quantite, optionIds: ligne.optionIds, extraIds: ligne.extraIds, note: ligne.note })),
      }))
      await navigate('/serveur', { replace: true, state: { message: `Commande n° ${commande.id} envoyée pour la table ${table.numero}.` } })
    } catch (probleme) {
      if (probleme instanceof ErreurApi && probleme.status === 401) {
        await navigate(`/connexion?retour=${encodeURIComponent('/serveur/commande')}`, { replace: true })
        return
      }
      // Même clé d'idempotence : réessayer ne crée jamais de doublon.
      setErreur(messageErreur(probleme, "La commande n'a pas pu être envoyée. Réessayez."))
      setEnCours(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#f5f6fa]">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white px-4">
        <Link to="/serveur" aria-label="Retour au service" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tuile text-primary">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-marque-nuit">Nouvelle commande</h1>
        {table && (
          <button
            type="button"
            onClick={() => {
              setTableId(null)
              setChaise(null)
            }}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-marque-nuit"
          >
            Table {table.numero} · changer
          </button>
        )}
      </header>

      {horsLigne && (
        <div className="px-4 pt-4">
          <BandeauHorsLigne recuLe={recuLe}>
            Préparez la commande : elle partira quand vous toucherez « Envoyer en cuisine » avec du réseau, sans risque de doublon.
          </BandeauHorsLigne>
        </div>
      )}

      {!table ? (
        <main className="p-4">
          <h2 className="mb-3 text-lg font-bold text-marque-nuit">Pour quelle table ?</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {menu.tables.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setTableId(candidate.id)}
                className="flex h-16 flex-col items-center justify-center rounded-2xl bg-white text-marque-nuit ring-1 ring-border active:bg-primary/10"
              >
                <span className="text-xl font-bold">{candidate.numero}</span>
                <span className="text-[11px] text-muted-foreground">{candidate.nombreChaises} places</span>
              </button>
            ))}
          </div>
        </main>
      ) : (
        <main className="flex flex-col gap-3 p-4 pb-28">
          <div className="rounded-2xl bg-white p-3 ring-1 ring-border">
            <p className="mb-2 text-sm font-semibold text-marque-nuit">
              Place du client <span className="font-normal text-muted-foreground">(facultatif)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={chaise === null} onClick={() => setChaise(null)} className={puce(chaise === null)}>
                Sans place
              </button>
              {Array.from({ length: table.nombreChaises }, (_, index) => index + 1).map((numero) => (
                <button key={numero} type="button" aria-pressed={chaise === numero} onClick={() => setChaise(numero)} className={cn(puce(chaise === numero), 'w-11 px-0')}>
                  {numero}
                </button>
              ))}
            </div>
          </div>

          <label className="relative block">
            <span className="sr-only">Rechercher un article</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
              placeholder="Rechercher un plat, une boisson…"
              className="h-12 w-full rounded-full bg-white pr-4 pl-12 text-base ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            <button type="button" aria-pressed={categorieId === null} onClick={() => setCategorieId(null)} className={puce(categorieId === null)}>
              Tout
            </button>
            {menu.categories.map((categorie) => (
              <button key={categorie.id} type="button" aria-pressed={categorieId === categorie.id} onClick={() => setCategorieId(categorie.id)} className={puce(categorieId === categorie.id)}>
                {categorie.nom}
              </button>
            ))}
          </div>

          {erreur && !recapOuvert && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}

          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl bg-white ring-1 ring-border">
            {plats.length === 0 ? (
              <li className="px-4 py-8 text-center text-muted-foreground">Aucun article ne correspond.</li>
            ) : (
              plats.map(({ plat, categorie }) => (
                <li key={plat.id} className={cn('flex items-center gap-3 px-4 py-3', !plat.disponible && 'opacity-50')}>
                  <button type="button" disabled={!plat.disponible} onClick={() => setPlatOuvert(plat)} className="min-w-0 flex-1 text-left">
                    <span className="block leading-snug font-semibold text-marque-nuit">{plat.nom}</span>
                    <span className="block text-sm text-muted-foreground">
                      {categorieId === null && `${categorie} · `}
                      {plat.disponible ? formaterPrix(plat.prix) : 'Épuisé'}
                      {plat.disponible && aDesChoix(plat) && ' · avec choix'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!plat.disponible}
                    onClick={() => ajoutRapide(plat)}
                    aria-label={`Ajouter ${plat.nom}`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:bg-muted-foreground"
                  >
                    <Plus className="size-5" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </main>
      )}

      {table && lignes.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-2xl px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setRecapOuvert(true)}
            className="flex h-14 w-full items-center justify-between rounded-full bg-primary px-6 text-base font-bold text-primary-foreground shadow-[0_8px_24px_rgba(21,86,167,0.35)]"
          >
            <span className="flex items-center gap-2.5">
              <ShoppingBag className="size-5" />
              Voir la commande · {articles}
            </span>
            <span>{formaterPrix(total)}</span>
          </button>
        </div>
      )}

      <FichePlat plat={platOuvert} afficherPhoto={false} onFermer={() => setPlatOuvert(null)} onAjouter={ajouter} libelleBouton="Ajouter à la commande" />

      <Sheet open={recapOuvert} onOpenChange={setRecapOuvert}>
        <SheetContent
          side="bottom"
          onOpenAutoFocus={(evenement) => evenement.preventDefault()}
          className="mx-auto max-h-[90dvh] max-w-2xl gap-0 overflow-y-auto rounded-t-3xl p-0"
        >
          <div className="px-5 pt-5 pb-3">
            <SheetTitle className="text-xl font-bold text-marque-nuit">
              Table {table?.numero}
              {chaise !== null && ` · place ${chaise}`}
            </SheetTitle>
            <SheetDescription>
              {articles} article{articles > 1 ? 's' : ''} · vérifiez avec le client avant d'envoyer.
            </SheetDescription>
          </div>
          <ul className="flex flex-col gap-4 px-5 py-2">
            {lignes.map((ligne) => (
              <li key={ligne.cle} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-semibold text-marque-nuit">{ligne.nom}</p>
                  {ligne.choix.map((choix) => (
                    <p key={choix.libelle} className="text-sm text-muted-foreground">{choix.libelle}</p>
                  ))}
                  {ligne.note && <p className="text-sm text-muted-foreground italic">« {ligne.note} »</p>}
                  <p className="font-bold text-marque-nuit">{formaterPrix(ligne.prixUnitaire * ligne.quantite)}</p>
                </div>
                <SelecteurQuantite quantite={ligne.quantite} onChange={(quantite) => changerQuantite(ligne.cle, quantite)} min={0} libelle={ligne.nom} />
              </li>
            ))}
          </ul>
          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {erreur && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}
            <div className="flex items-center justify-between text-lg font-bold text-marque-nuit">
              <span>Total</span>
              <span className="text-emerald-700">{formaterPrix(total)}</span>
            </div>
            <button
              type="button"
              disabled={enCours || lignes.length === 0}
              onClick={() => void envoyer()}
              className="h-14 w-full rounded-full bg-primary text-lg font-bold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {enCours ? 'Envoi…' : 'Envoyer en cuisine'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
