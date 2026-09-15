import { CirclePlus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarreEnregistrement } from '@/components/admin/BarreEnregistrement'
import { ChampMontant } from '@/components/admin/ChampMontant'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { classeChampCompact } from '@/lib/formulaire'
import { genererUuid } from '@/lib/uuid'
import type { PlatAdmin } from '@/types/carte'

interface ExtraBrouillon {
  cle: string
  nom: string
  prix: number | null
}

const versApi = (extras: readonly ExtraBrouillon[]) => extras.map((extra) => ({ nom: extra.nom.trim(), prix: extra.prix ?? 0 }))

interface Props {
  plat: PlatAdmin
  onModifie: (plat: PlatAdmin) => void
}

/** Onglet « Extras » (maquette FoodScan « Extra ») : suppléments payants facultatifs, cumulables. */
export function OngletExtras({ plat, onModifie }: Props) {
  const initial = useMemo<ExtraBrouillon[]>(() => plat.extras.map((extra) => ({ cle: String(extra.id), nom: extra.nom, prix: extra.prix })), [plat])
  const [extras, setExtras] = useState(initial)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const modifie = JSON.stringify(versApi(extras)) !== JSON.stringify(versApi(initial))
  const incomplet = extras.some((extra) => extra.nom.trim() === '' || extra.prix === null) ? 'Chaque extra doit avoir un nom et un prix.' : null
  const changer = (cle: string, maj: Partial<ExtraBrouillon>) =>
    setExtras((liste) => liste.map((extra) => (extra.cle === cle ? { ...extra, ...maj } : extra)))

  const enregistrer = async () => {
    if (!modifie || incomplet || enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      const { plat: misAJour } = await requeteApi<{ plat: PlatAdmin }>(`/plats/${plat.id}`, enJson('PATCH', { extras: versApi(extras) }))
      onModifie(misAJour)
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Enregistrement impossible. Réessayez.'))
      setEnCours(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Suppléments facultatifs que le client coche en plus : sauce, fromage, œuf… Il peut en prendre plusieurs.
        </p>
        <button
          type="button"
          onClick={() => setExtras((liste) => [...liste, { cle: genererUuid(), nom: '', prix: null }])}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-foreground"
        >
          <CirclePlus className="size-4" />
          Ajouter un extra
        </button>
      </div>

      {erreur && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}

      {extras.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-muted-foreground">Aucun extra pour ce plat.</p>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.15em] text-marque-nuit uppercase">
                <th scope="col" className="px-4 py-3 font-medium">Nom</th>
                <th scope="col" className="w-44 px-4 py-3 font-medium">Prix</th>
                <th scope="col" className="w-16 px-4 py-3 font-medium"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {extras.map((extra) => (
                <tr key={extra.cle} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2">
                    <input
                      value={extra.nom}
                      maxLength={50}
                      aria-label="Nom de l'extra"
                      onChange={(evenement) => changer(extra.cle, { nom: evenement.target.value })}
                      placeholder="Sauce piquante, Fromage…"
                      className={classeChampCompact}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <ChampMontant valeur={extra.prix} onChange={(prix) => changer(extra.cle, { prix })} libelle="Prix de l'extra" compact />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setExtras((liste) => liste.filter((element) => element.cle !== extra.cle))}
                      aria-label={`Supprimer l'extra ${extra.nom}`}
                      className="flex size-8 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100"
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

      <BarreEnregistrement
        modifie={modifie}
        enCours={enCours}
        incomplet={modifie ? incomplet : null}
        onEnregistrer={() => void enregistrer()}
        onAnnuler={() => setExtras(initial)}
      />
    </div>
  )
}
