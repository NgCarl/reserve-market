import { ArrowDown, ArrowUp, CirclePlus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData, useRevalidator } from 'react-router'
import { DialogueCategorie } from '@/components/admin/DialogueCategorie'
import { DialogueConfirmation } from '@/components/admin/DialogueConfirmation'
import { PastillePoste } from '@/components/admin/PastillePoste'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import type { CategorieAdmin } from '@/types/carte'
import type { chargerCategories } from './admin.loader'

const actionIcone = 'flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-30'

/** Catégories de la carte (maquette FoodScan « Item Categories ») : poste, ordre d'affichage, archivage. */
export function CategoriesPage() {
  const { categories } = useLoaderData<typeof chargerCategories>()
  const { revalidate } = useRevalidator()
  const [edition, setEdition] = useState<{ categorie: CategorieAdmin | null } | null>(null)
  const [aArchiver, setAArchiver] = useState<CategorieAdmin | null>(null)
  const [enDeplacement, setEnDeplacement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const deplacer = async (index: number, sens: -1 | 1) => {
    const courante = categories[index]
    const voisine = categories[index + sens]
    if (!courante || !voisine || enDeplacement) return
    setEnDeplacement(true)
    setErreur(null)
    try {
      // Les deux catégories échangent leur position ; l'ordre est recalé sur la position affichée.
      await Promise.all([
        requeteApi(`/categories/${courante.id}`, enJson('PATCH', { ordre: index + sens })),
        requeteApi(`/categories/${voisine.id}`, enJson('PATCH', { ordre: index })),
      ])
      await revalidate()
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Déplacement impossible. Réessayez.'))
    } finally {
      setEnDeplacement(false)
    }
  }

  const archiver = async () => {
    if (!aArchiver) return
    await requeteApi<void>(`/categories/${aArchiver.id}`, { method: 'DELETE' })
    setAArchiver(null)
    await revalidate()
  }

  return (
    <section className="rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h1 className="text-xl font-medium text-marque-nuit">Catégories</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">L'ordre ci-dessous est celui des onglets de la carte sur le téléphone du client.</p>
        </div>
        <button
          type="button"
          onClick={() => setEdition({ categorie: null })}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-medium text-primary-foreground"
        >
          <CirclePlus className="size-4" />
          Ajouter une catégorie
        </button>
      </div>

      {erreur && <p role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[15px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-border text-xs tracking-[0.15em] text-marque-nuit uppercase">
              <th scope="col" className="w-24 px-5 py-3.5 font-medium">Ordre</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Nom</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Poste</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Plats</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((categorie, index) => (
              <tr key={categorie.id} className="border-b border-border last:border-b-0">
                <td className="px-5 py-2.5">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void deplacer(index, -1)}
                      disabled={index === 0 || enDeplacement}
                      aria-label={`Monter ${categorie.nom}`}
                      className={`${actionIcone} text-muted-foreground hover:bg-tuile hover:text-marque-nuit`}
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deplacer(index, 1)}
                      disabled={index === categories.length - 1 || enDeplacement}
                      aria-label={`Descendre ${categorie.nom}`}
                      className={`${actionIcone} text-muted-foreground hover:bg-tuile hover:text-marque-nuit`}
                    >
                      <ArrowDown className="size-4" />
                    </button>
                  </div>
                </td>
                <td className="px-5 py-2.5 text-marque-nuit">{categorie.nom}</td>
                <td className="px-5 py-2.5"><PastillePoste poste={categorie.poste} /></td>
                <td className="px-5 py-2.5">
                  <Link to={`/admin/plats?categorie=${categorie.id}`} className="text-primary hover:underline">
                    {categorie._count.plats} plat{categorie._count.plats > 1 ? 's' : ''}
                  </Link>
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEdition({ categorie })}
                      aria-label={`Modifier ${categorie.nom}`}
                      title="Modifier"
                      className={`${actionIcone} bg-emerald-50 text-emerald-600 hover:bg-emerald-100`}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAArchiver(categorie)}
                      aria-label={`Archiver ${categorie.nom}`}
                      title="Archiver"
                      className={`${actionIcone} bg-red-50 text-red-600 hover:bg-red-100`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-border px-5 py-4 text-sm text-marque-nuit">
        {categories.length} catégorie{categories.length > 1 ? 's' : ''}
      </p>

      <DialogueCategorie
        key={edition ? (edition.categorie?.id ?? 'nouvelle') : 'fermee'}
        ouvert={edition !== null}
        categorie={edition?.categorie ?? null}
        onFermer={() => setEdition(null)}
        onEnregistree={() => {
          setEdition(null)
          void revalidate()
        }}
      />

      <DialogueConfirmation
        key={aArchiver?.id ?? 'aucune'}
        ouvert={aArchiver !== null}
        titre={`Archiver « ${aArchiver?.nom ?? ''} »`}
        description="La catégorie disparaît de la carte. Elle doit d'abord être vide : archivez ou déplacez ses plats."
        libelleConfirmer="Archiver"
        onConfirmer={archiver}
        onFermer={() => setAArchiver(null)}
      />
    </section>
  )
}
