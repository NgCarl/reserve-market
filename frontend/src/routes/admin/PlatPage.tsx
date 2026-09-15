import { ArrowLeft, CirclePlus, Image, Info, LayoutGrid, Puzzle } from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { OngletChoix } from '@/components/admin/plat/OngletChoix'
import { OngletComplements } from '@/components/admin/plat/OngletComplements'
import { OngletExtras } from '@/components/admin/plat/OngletExtras'
import { OngletInformations } from '@/components/admin/plat/OngletInformations'
import { OngletPhoto } from '@/components/admin/plat/OngletPhoto'
import { cn } from '@/lib/utils'
import type { CategorieAdmin, PlatAdmin } from '@/types/carte'
import type { chargerPlat } from './admin.loader'

type Onglet = 'informations' | 'photo' | 'choix' | 'extras' | 'complements'

// Onglets de la fiche FoodScan (Information, Images, Variation, Extra, Addon), sans Traductions ni Branches.
const ONGLETS: { valeur: Onglet; libelle: string; Icone: typeof Info }[] = [
  { valeur: 'informations', libelle: 'Informations', Icone: Info },
  { valeur: 'photo', libelle: 'Photo', Icone: Image },
  { valeur: 'choix', libelle: 'Tailles et choix', Icone: LayoutGrid },
  { valeur: 'extras', libelle: 'Extras', Icone: CirclePlus },
  { valeur: 'complements', libelle: 'Compléments', Icone: Puzzle },
]

/** Fiche d'un plat, ou création quand l'adresse est /admin/plats/nouveau. */
export function PlatPage() {
  const donnees = useLoaderData<typeof chargerPlat>()
  // Une clé par plat : en passant d'une fiche à une autre, l'état repart des données du nouveau plat.
  return <FichePlat key={donnees.plat?.id ?? 'nouveau'} platCharge={donnees.plat} categories={donnees.categories} plats={donnees.plats} />
}

interface PropsFiche {
  platCharge: PlatAdmin | null
  categories: CategorieAdmin[]
  plats: PlatAdmin[]
}

function FichePlat({ platCharge, categories, plats }: PropsFiche) {
  const navigate = useNavigate()
  const [parametres, setParametres] = useSearchParams()
  // Tenu à jour avec le plat renvoyé par chaque enregistrement : inutile de relire toute la carte sur un serveur lent.
  const [plat, setPlat] = useState(platCharge)
  // Incrémentée à chaque enregistrement : l'onglet repart des données enregistrées.
  const [version, setVersion] = useState(0)
  const demande = ONGLETS.find((onglet) => onglet.valeur === parametres.get('onglet'))?.valeur ?? 'informations'
  const actif: Onglet = plat ? demande : 'informations'

  const apresModification = (misAJour: PlatAdmin) => {
    setPlat(misAJour)
    setVersion((valeur) => valeur + 1)
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link to="/admin/plats" aria-label="Retour aux plats" className="flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-[0_1px_3px_rgba(3,40,66,0.08)]">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-medium text-marque-nuit">{plat ? plat.nom : 'Nouveau plat'}</h1>
        {plat && !plat.disponible && <span className="rounded-md bg-red-50 px-2.5 py-1 text-sm text-red-600">Épuisé</span>}
      </div>

      <div role="tablist" aria-label="Sections de la fiche" className="flex overflow-x-auto">
        {ONGLETS.map(({ valeur, libelle, Icone }) => {
          const disponible = plat !== null || valeur === 'informations'
          return (
            <button
              key={valeur}
              type="button"
              role="tab"
              aria-selected={actif === valeur}
              disabled={!disponible}
              title={disponible ? undefined : "Créez d'abord le plat"}
              onClick={() => setParametres(valeur === 'informations' ? {} : { onglet: valeur }, { replace: true })}
              className={cn(
                '-mb-px flex h-12 shrink-0 items-center gap-2 rounded-t-lg border px-4 text-[15px] whitespace-nowrap transition-colors sm:px-5',
                actif === valeur
                  ? 'border-border border-b-white bg-white text-primary'
                  : 'border-transparent text-marque-nuit/80 hover:text-primary disabled:text-muted-foreground/50 disabled:hover:text-muted-foreground/50',
              )}
            >
              <Icone className="size-4" />
              {libelle}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl rounded-tl-none border border-border bg-white p-4 sm:p-5">
        {actif === 'informations' && (
          <OngletInformations
            key={`informations-${version}`}
            plat={plat}
            categories={categories}
            onEnregistre={async (resultat) => {
              // Plat créé : on ouvre sa fiche pour ajouter la photo et les choix.
              if (!plat) await navigate(`/admin/plats/${resultat.id}?onglet=photo`, { replace: true })
              else apresModification(resultat)
            }}
          />
        )}
        {plat && actif === 'photo' && <OngletPhoto key={`photo-${version}`} plat={plat} onModifie={apresModification} />}
        {plat && actif === 'choix' && <OngletChoix key={`choix-${version}`} plat={plat} onModifie={apresModification} />}
        {plat && actif === 'extras' && <OngletExtras key={`extras-${version}`} plat={plat} onModifie={apresModification} />}
        {plat && actif === 'complements' && (
          <OngletComplements key={`complements-${version}`} plat={plat} plats={plats} categories={categories} onModifie={apresModification} />
        )}
      </div>
    </section>
  )
}
