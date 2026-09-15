import { CirclePlus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { formaterPrix } from '@/lib/format'
import { classeListeCompacte } from '@/lib/formulaire'
import type { CategorieAdmin, PlatAdmin } from '@/types/carte'

interface Props {
  plat: PlatAdmin
  plats: PlatAdmin[]
  categories: CategorieAdmin[]
  onModifie: (plat: PlatAdmin) => void
}

/** Onglet « Compléments » (maquette FoodScan « Addon ») : autres articles de la carte proposés avec ce plat. */
export function OngletComplements({ plat, plats, categories, onModifie }: Props) {
  const [selection, setSelection] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Un complément s'ajoute au panier sans choix : seuls les articles sans taille ni option peuvent être proposés.
  const candidatsParCategorie = useMemo(() => {
    const dejaProposes = new Set(plat.addons.map((addon) => addon.id))
    return categories
      .map((categorie) => ({
        categorie,
        plats: plats.filter((candidat) => candidat.categorieId === categorie.id
          && candidat.id !== plat.id
          && candidat.groupesVariantes.length === 0
          && !dejaProposes.has(candidat.id)),
      }))
      .filter((groupe) => groupe.plats.length > 0)
  }, [plat, plats, categories])

  const enregistrer = async (addonIds: number[]) => {
    setEnCours(true)
    setErreur(null)
    try {
      const { plat: misAJour } = await requeteApi<{ plat: PlatAdmin }>(`/plats/${plat.id}`, enJson('PATCH', { addonIds }))
      onModifie(misAJour)
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Enregistrement impossible. Réessayez.'))
      setEnCours(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Proposés en bas de la fiche du plat, avec leur propre compteur : par exemple une boisson avec un plat.
        Chaque complément commandé part vers son propre poste (bar ou cuisine).
      </p>

      {erreur && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}

      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Article à proposer"
          value={selection}
          onChange={(evenement) => setSelection(evenement.target.value)}
          className={`${classeListeCompacte} w-full sm:w-auto sm:min-w-[320px]`}
        >
          <option value="">Choisir un article…</option>
          {candidatsParCategorie.map(({ categorie, plats: candidats }) => (
            <optgroup key={categorie.id} label={categorie.nom}>
              {candidats.map((candidat) => (
                <option key={candidat.id} value={candidat.id}>{candidat.nom} · {formaterPrix(candidat.prix)}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          disabled={selection === '' || enCours}
          onClick={() => void enregistrer([...plat.addons.map((addon) => addon.id), Number(selection)])}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-foreground disabled:opacity-40"
        >
          <CirclePlus className="size-4" />
          Ajouter le complément
        </button>
      </div>

      {plat.addons.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-muted-foreground">Aucun complément proposé.</p>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[420px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.15em] text-marque-nuit uppercase">
                <th scope="col" className="px-4 py-3 font-medium">Nom</th>
                <th scope="col" className="px-4 py-3 font-medium">Prix</th>
                <th scope="col" className="w-16 px-4 py-3 font-medium"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {plat.addons.map((addon) => (
                <tr key={addon.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5 text-marque-nuit">{addon.nom}</td>
                  <td className="px-4 py-2.5 text-marque-nuit">{formaterPrix(addon.prix)}</td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      disabled={enCours}
                      onClick={() => void enregistrer(plat.addons.filter((element) => element.id !== addon.id).map((element) => element.id))}
                      aria-label={`Retirer ${addon.nom}`}
                      className="flex size-8 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
