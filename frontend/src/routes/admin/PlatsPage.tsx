import { CirclePlus, ImageOff, Pencil, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLoaderData, useRevalidator, useSearchParams } from 'react-router'
import { DialogueConfirmation } from '@/components/admin/DialogueConfirmation'
import { Interrupteur } from '@/components/admin/Interrupteur'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { formaterPrix } from '@/lib/format'
import { classeChampCompact, classeListeCompacte } from '@/lib/formulaire'
import { normaliser } from '@/lib/texte'
import type { PlatAdmin } from '@/types/carte'
import type { chargerPlats } from './admin.loader'

type FiltreDisponibilite = 'tous' | 'disponibles' | 'epuises'

const actionIcone = 'flex size-8 items-center justify-center rounded-md transition-colors'

/** Résumé des choix d'un plat, sous son nom. */
function resume(plat: PlatAdmin): string {
  const parties: string[] = []
  for (const groupe of plat.groupesVariantes) parties.push(`${groupe.nom} (${groupe.options.length})`)
  if (plat.extras.length > 0) parties.push(`${plat.extras.length} extra${plat.extras.length > 1 ? 's' : ''}`)
  if (plat.addons.length > 0) parties.push(`${plat.addons.length} complément${plat.addons.length > 1 ? 's' : ''}`)
  return parties.join(' · ')
}

/** Plats de la carte (maquette FoodScan « Items ») : recherche, filtres, disponibilité en un clic. */
export function PlatsPage() {
  const { plats, categories } = useLoaderData<typeof chargerPlats>()
  const { revalidate } = useRevalidator()
  const [parametres, setParametres] = useSearchParams()
  const [recherche, setRecherche] = useState('')
  const [disponibilite, setDisponibilite] = useState<FiltreDisponibilite>('tous')
  const [enCours, setEnCours] = useState<number | null>(null)
  const [aArchiver, setAArchiver] = useState<PlatAdmin | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const categorieFiltre = parametres.get('categorie') ?? ''

  const nomsCategories = useMemo(() => new Map(categories.map((categorie) => [categorie.id, categorie.nom])), [categories])
  const visibles = useMemo(() => {
    const terme = normaliser(recherche)
    return plats.filter((plat) => {
      if (categorieFiltre && String(plat.categorieId) !== categorieFiltre) return false
      const servable = plat.disponible && plat.stock !== 0
      if (disponibilite === 'disponibles' && !servable) return false
      if (disponibilite === 'epuises' && servable) return false
      return !terme || normaliser(plat.nom).includes(terme)
    })
  }, [plats, categorieFiltre, disponibilite, recherche])

  const basculer = async (plat: PlatAdmin) => {
    setEnCours(plat.id)
    setErreur(null)
    try {
      await requeteApi(`/plats/${plat.id}`, enJson('PATCH', { disponible: !plat.disponible }))
      await revalidate()
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Modification impossible. Réessayez.'))
    } finally {
      setEnCours(null)
    }
  }

  const archiver = async () => {
    if (!aArchiver) return
    await requeteApi<void>(`/plats/${aArchiver.id}`, { method: 'DELETE' })
    setAArchiver(null)
    await revalidate()
  }

  return (
    <section className="rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h1 className="text-xl font-medium text-marque-nuit">Plats</h1>
        <Link to="/admin/plats/nouveau" className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-medium text-primary-foreground">
          <CirclePlus className="size-4" />
          Ajouter un plat
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-border px-5 py-3">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Rechercher un plat</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={recherche}
            onChange={(evenement) => setRecherche(evenement.target.value)}
            placeholder="Rechercher un plat"
            className={`${classeChampCompact} pl-9`}
          />
        </label>
        <select
          aria-label="Filtrer par catégorie"
          value={categorieFiltre}
          onChange={(evenement) => setParametres(evenement.target.value ? { categorie: evenement.target.value } : {}, { replace: true })}
          className={`${classeListeCompacte} min-w-[180px]`}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((categorie) => (
            <option key={categorie.id} value={categorie.id}>{categorie.nom}</option>
          ))}
        </select>
        <select
          aria-label="Filtrer par disponibilité"
          value={disponibilite}
          onChange={(evenement) => setDisponibilite(evenement.target.value as FiltreDisponibilite)}
          className={classeListeCompacte}
        >
          <option value="tous">Tous</option>
          <option value="disponibles">Disponibles</option>
          <option value="epuises">Épuisés</option>
        </select>
      </div>

      {erreur && <p role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}

      {visibles.length === 0 ? (
        <p className="px-5 py-10 text-center text-muted-foreground">Aucun plat ne correspond à ces filtres.</p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.15em] text-marque-nuit uppercase">
                <th scope="col" className="px-5 py-3.5 font-medium">Nom</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Catégorie</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Prix</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Disponible</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((plat) => {
                const aSupplements = plat.groupesVariantes.some((groupe) => groupe.options.some((option) => option.supplement > 0))
                const details = resume(plat)
                return (
                  <tr key={plat.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-2.5">
                      <Link to={`/admin/plats/${plat.id}`} className="flex items-center gap-3">
                        {plat.photo?.url ? (
                          <img src={plat.photo.url} alt="" width={44} height={44} loading="lazy" className="size-11 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-tuile text-muted-foreground">
                            <ImageOff className="size-4" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block text-marque-nuit hover:text-primary">{plat.nom}</span>
                          {details && <span className="block text-xs text-muted-foreground">{details}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-2.5 whitespace-nowrap text-muted-foreground">{nomsCategories.get(plat.categorieId)}</td>
                    <td className="px-5 py-2.5 whitespace-nowrap text-marque-nuit">
                      {aSupplements && <span className="text-xs text-muted-foreground">dès </span>}
                      {formaterPrix(plat.prix)}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Interrupteur
                          actif={plat.disponible}
                          onChange={() => void basculer(plat)}
                          libelle={`${plat.nom} disponible`}
                          desactive={enCours === plat.id}
                        />
                        {plat.stock === 0 && <span className="text-xs font-medium text-red-600">Stock épuisé</span>}
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/plats/${plat.id}`}
                          aria-label={`Modifier ${plat.nom}`}
                          title="Modifier"
                          className={`${actionIcone} bg-emerald-50 text-emerald-600 hover:bg-emerald-100`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setAArchiver(plat)}
                          aria-label={`Archiver ${plat.nom}`}
                          title="Archiver"
                          className={`${actionIcone} bg-red-50 text-red-600 hover:bg-red-100`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="border-t border-border px-5 py-4 text-sm text-marque-nuit">
        {visibles.length === plats.length ? `${plats.length} plats` : `${visibles.length} sur ${plats.length} plats`}
      </p>

      <DialogueConfirmation
        key={aArchiver?.id ?? 'aucun'}
        ouvert={aArchiver !== null}
        titre={`Archiver « ${aArchiver?.nom ?? ''} »`}
        description="Le plat disparaît de la carte. Les commandes déjà passées le gardent dans leur historique."
        libelleConfirmer="Archiver"
        onConfirmer={archiver}
        onFermer={() => setAArchiver(null)}
      />
    </section>
  )
}
