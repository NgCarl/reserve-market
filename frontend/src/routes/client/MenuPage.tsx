import { Search, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLoaderData } from 'react-router'
import { CartePlat } from '@/components/menu/CartePlat'
import { EnteteMenu } from '@/components/menu/EnteteMenu'
import { FichePlat } from '@/components/menu/FichePlat'
import { OngletsCategories } from '@/components/menu/OngletsCategories'
import { PanierSheet } from '@/components/menu/PanierSheet'
import { formaterPrix } from '@/lib/format'
import { idSection } from '@/lib/menu'
import { reseauLent } from '@/lib/reseau'
import { normaliser } from '@/lib/texte'
import { cn } from '@/lib/utils'
import { nombreArticles, totalPanier, usePanier } from '@/stores/panier'
import { usePreferences, type Disposition } from '@/stores/preferences'
import type { CategorieMenu, PlatMenu } from '@/types/menu'
import type { chargerMenu } from './menu.loader'

function filtrer(categories: CategorieMenu[], recherche: string): CategorieMenu[] {
  const terme = normaliser(recherche)
  if (!terme) return categories
  return categories
    .map((categorie) => ({
      ...categorie,
      plats: categorie.plats.filter((plat) => normaliser(`${plat.nom} ${plat.description ?? ''}`).includes(terme)),
    }))
    .filter((categorie) => categorie.plats.length > 0)
}

// Pictogrammes pleins des maquettes FoodScan : deux barres (liste), quatre carrés (grille).
function IconeListe() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" fill="currentColor">
      <rect x="2" y="3" width="20" height="8" rx="2" />
      <rect x="2" y="13" width="20" height="8" rx="2" />
    </svg>
  )
}

function IconeGrille() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" fill="currentColor">
      <rect x="2" y="2" width="9" height="9" rx="2" />
      <rect x="13" y="2" width="9" height="9" rx="2" />
      <rect x="2" y="13" width="9" height="9" rx="2" />
      <rect x="13" y="13" width="9" height="9" rx="2" />
    </svg>
  )
}

const boutonsDisposition: { valeur: Disposition; libelle: string; Icone: () => React.JSX.Element }[] = [
  { valeur: 'liste', libelle: 'Affichage en liste', Icone: IconeListe },
  { valeur: 'grille', libelle: 'Affichage en grille', Icone: IconeGrille },
]

export function MenuPage() {
  const menu = useLoaderData<typeof chargerMenu>()
  const [recherche, setRecherche] = useState('')
  const [platOuvert, setPlatOuvert] = useState<PlatMenu | null>(null)
  const [panierOuvert, setPanierOuvert] = useState(false)
  // Réseau lent ou économiseur de données : menu texte automatique (CLAUDE.md §8).
  const [afficherPhotos] = useState(() => !reseauLent())
  const disposition = usePreferences((etat) => etat.disposition)
  const choisirDisposition = usePreferences((etat) => etat.choisirDisposition)
  const lignes = usePanier((etat) => etat.lignes)

  const categories = useMemo(() => filtrer(menu.categories, recherche), [menu.categories, recherche])
  const articles = nombreArticles(lignes)
  const total = totalPanier(lignes)

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-28">
      <EnteteMenu numeroTable={menu.table.numero} articles={articles} total={total} onOuvrirPanier={() => setPanierOuvert(true)} />

      <div className="sticky top-16 z-10 flex flex-col gap-3 bg-white/95 px-4 pt-4 pb-3 backdrop-blur">
        <label className="relative block">
          <span className="sr-only">Rechercher un plat</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            enterKeyHint="search"
            value={recherche}
            onChange={(evenement) => setRecherche(evenement.target.value)}
            placeholder="Rechercher un plat, une boisson…"
            className="h-12 w-full rounded-full bg-tuile pr-4 pl-12 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-primary/20"
          />
        </label>
        {categories.length > 0 && <OngletsCategories categories={categories} />}
      </div>

      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h1 className="text-3xl font-bold text-primary">Tous les articles</h1>
        <div className="flex gap-1" role="group" aria-label="Disposition du menu">
          {boutonsDisposition.map(({ valeur, libelle, Icone }) => (
            <button
              key={valeur}
              type="button"
              onClick={() => choisirDisposition(valeur)}
              aria-pressed={disposition === valeur}
              aria-label={libelle}
              className={cn(
                'flex size-10 items-center justify-center rounded-xl transition-colors',
                disposition === valeur ? 'text-primary' : 'text-muted-foreground/50',
              )}
            >
              <Icone />
            </button>
          ))}
        </div>
      </div>

      <main className="flex flex-col gap-7 px-4 pt-3">
        {categories.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Aucun plat ne correspond à « {recherche} ».</p>
        )}
        {categories.map((categorie) => (
          <section key={categorie.id} id={idSection(categorie.id)} data-categorie={categorie.id} className="scroll-mt-44">
            <h2 className="mb-3.5 text-xl font-bold text-marque-nuit">{categorie.nom}</h2>
            <div className={disposition === 'grille' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3.5'}>
              {categorie.plats.map((plat) => (
                <CartePlat
                  key={plat.id}
                  plat={plat}
                  disposition={disposition}
                  afficherPhoto={afficherPhotos}
                  onOuvrir={setPlatOuvert}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {articles > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setPanierOuvert(true)}
            className="flex h-14 w-full items-center justify-between rounded-full bg-primary px-6 text-base font-bold text-primary-foreground shadow-[0_8px_24px_rgba(21,86,167,0.35)] transition-transform active:scale-[0.98]"
          >
            <span className="flex items-center gap-2.5">
              <ShoppingBag className="size-5" />
              Voir le panier · {articles}
            </span>
            <span>{formaterPrix(total)}</span>
          </button>
        </div>
      )}

      <FichePlat plat={platOuvert} afficherPhoto={afficherPhotos} onFermer={() => setPlatOuvert(null)} />
      <PanierSheet ouvert={panierOuvert} onOuvertChange={setPanierOuvert} numeroTable={menu.table.numero} afficherPhotos={afficherPhotos} />
    </div>
  )
}
