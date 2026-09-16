import { Image, ImageOff, Search, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BandeauCommandes } from '@/components/menu/BandeauCommandes'
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
import { useCommandesTable } from '@/hooks/useCommandesTable'
import { useMenu } from '@/hooks/useMenu'
import type { CategorieMenu, PlatMenu } from '@/types/menu'

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
  const menu = useMenu()
  const { jeton = '' } = useParams()
  const navigate = useNavigate()
  const commandesTable = useCommandesTable(jeton)
  const [recherche, setRecherche] = useState('')
  const [platOuvert, setPlatOuvert] = useState<PlatMenu | null>(null)
  const [panierOuvert, setPanierOuvert] = useState(false)
  // Réseau lent ou économiseur de données : menu texte automatique (CLAUDE.md §8), que le client peut forcer.
  const [reseauMenage] = useState(reseauLent)
  const photos = usePreferences((etat) => etat.photos)
  const choisirPhotos = usePreferences((etat) => etat.choisirPhotos)
  const afficherPhotos = photos === 'auto' ? !reseauMenage : photos === 'oui'
  const disposition = usePreferences((etat) => etat.disposition)
  const choisirDisposition = usePreferences((etat) => etat.choisirDisposition)
  const lignes = usePanier((etat) => etat.lignes)

  const categories = useMemo(() => filtrer(menu.categories, recherche), [menu.categories, recherche])
  const articles = nombreArticles(lignes)
  const total = totalPanier(lignes)

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-28">
      <EnteteMenu numeroTable={menu.table.numero} articles={articles} total={total} onOuvrirPanier={() => setPanierOuvert(true)} />

      {commandesTable && <BandeauCommandes jeton={jeton} commandes={commandesTable} />}

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
        {categories.length > 0 && <OngletsCategories categories={categories} afficherPhotos={afficherPhotos} />}
      </div>

      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h1 className="text-3xl font-bold text-primary">Tous les articles</h1>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => choisirPhotos(afficherPhotos ? 'non' : 'oui')}
            aria-pressed={afficherPhotos}
            aria-label={afficherPhotos ? 'Masquer les photos' : 'Afficher les photos'}
            title={afficherPhotos ? 'Masquer les photos' : 'Afficher les photos'}
            className={cn(
              'flex size-10 items-center justify-center rounded-xl transition-colors',
              afficherPhotos ? 'text-primary' : 'text-muted-foreground/50',
            )}
          >
            {afficherPhotos ? <Image className="size-5" /> : <ImageOff className="size-5" />}
          </button>
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

      {!afficherPhotos && photos === 'auto' && (
        <p className="mx-4 mt-1 flex items-center gap-2 rounded-xl bg-tuile px-3.5 py-2 text-sm text-marque-nuit">
          <ImageOff className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1">Photos masquées pour économiser votre connexion.</span>
          <button type="button" onClick={() => choisirPhotos('oui')} className="font-semibold text-primary underline">
            Afficher
          </button>
        </p>
      )}

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
      <PanierSheet
        ouvert={panierOuvert}
        onOuvertChange={setPanierOuvert}
        numeroTable={menu.table.numero}
        afficherPhotos={afficherPhotos}
        onCommander={() => {
          setPanierOuvert(false)
          navigate(`/menu/${jeton}/commande`)
        }}
      />
    </div>
  )
}
