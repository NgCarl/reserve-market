import { CirclePlus, ImagePlus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarreEnregistrement } from '@/components/admin/BarreEnregistrement'
import { ChampMontant } from '@/components/admin/ChampMontant'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { envoyerPhoto } from '@/lib/cloudinary'
import { formaterPrix } from '@/lib/format'
import { classeChampCompact, classeListeCompacte } from '@/lib/formulaire'
import { genererUuid } from '@/lib/uuid'
import type { AffichageGroupe, PlatAdmin } from '@/types/carte'

interface OptionBrouillon {
  cle: string
  nom: string
  supplement: number | null
  imagePublicId: string | null
  photoUrl: string | null
}

interface GroupeBrouillon {
  cle: string
  nom: string
  affichage: AffichageGroupe
  options: OptionBrouillon[]
}

const nouvelleOption = (): OptionBrouillon => ({ cle: genererUuid(), nom: '', supplement: 0, imagePublicId: null, photoUrl: null })
const nouveauGroupe = (): GroupeBrouillon => ({ cle: genererUuid(), nom: '', affichage: 'TUILES', options: [nouvelleOption()] })

/** Corps envoyé à l'API ; sert aussi à savoir si le brouillon diffère de ce qui est enregistré. */
const versApi = (groupes: readonly GroupeBrouillon[]) =>
  groupes.map((groupe) => ({
    nom: groupe.nom.trim(),
    affichage: groupe.affichage,
    options: groupe.options.map((option) => ({ nom: option.nom.trim(), supplement: option.supplement ?? 0, imagePublicId: option.imagePublicId })),
  }))

interface Props {
  plat: PlatAdmin
  onModifie: (plat: PlatAdmin) => void
}

/** Onglet « Tailles et choix » (maquette FoodScan « Variation ») : groupes à choix unique et leurs options. */
export function OngletChoix({ plat, onModifie }: Props) {
  const initial = useMemo<GroupeBrouillon[]>(
    () => plat.groupesVariantes.map((groupe) => ({
      cle: String(groupe.id),
      nom: groupe.nom,
      affichage: groupe.affichage,
      options: groupe.options.map((option) => ({
        cle: String(option.id),
        nom: option.nom,
        supplement: option.supplement,
        imagePublicId: option.imagePublicId,
        photoUrl: option.photoUrl,
      })),
    })),
    [plat],
  )
  const [groupes, setGroupes] = useState(initial)
  const [enCours, setEnCours] = useState(false)
  const [photoEnCours, setPhotoEnCours] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const modifie = JSON.stringify(versApi(groupes)) !== JSON.stringify(versApi(initial))
  const incomplet = groupes.some((groupe) => groupe.nom.trim() === '')
    ? 'Chaque choix doit avoir un nom (Taille, Accompagnement…).'
    : groupes.some((groupe) => groupe.options.length === 0 || groupe.options.some((option) => option.nom.trim() === '' || option.supplement === null))
      ? 'Chaque option doit avoir un nom et un supplément (0 si aucun).'
      : null

  const changerGroupe = (cle: string, maj: Partial<GroupeBrouillon>) =>
    setGroupes((liste) => liste.map((groupe) => (groupe.cle === cle ? { ...groupe, ...maj } : groupe)))
  const changerOption = (cleGroupe: string, cleOption: string, maj: Partial<OptionBrouillon>) =>
    setGroupes((liste) => liste.map((groupe) => (groupe.cle === cleGroupe
      ? { ...groupe, options: groupe.options.map((option) => (option.cle === cleOption ? { ...option, ...maj } : option)) }
      : groupe)))

  const choisirPhoto = async (cleGroupe: string, cleOption: string, fichier: File) => {
    setPhotoEnCours(cleOption)
    setErreur(null)
    try {
      const photo = await envoyerPhoto(fichier)
      changerOption(cleGroupe, cleOption, { imagePublicId: photo.public_id, photoUrl: photo.secure_url })
    } catch (probleme) {
      setErreur(messageErreur(probleme, "La photo n'a pas pu être envoyée."))
    } finally {
      setPhotoEnCours(null)
    }
  }

  const enregistrer = async () => {
    if (!modifie || incomplet || enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      const { plat: misAJour } = await requeteApi<{ plat: PlatAdmin }>(`/plats/${plat.id}`, enJson('PATCH', { groupesVariantes: versApi(groupes) }))
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
          Le client choisit une option dans chaque groupe avant d'ajouter le plat au panier. Le supplément s'ajoute au prix de base
          ({formaterPrix(plat.prix)}). « Boutons » convient aux tailles, « Liste déroulante » aux longues listes (accompagnements).
        </p>
        <button
          type="button"
          onClick={() => setGroupes((liste) => [...liste, nouveauGroupe()])}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-foreground"
        >
          <CirclePlus className="size-4" />
          Ajouter un choix
        </button>
      </div>

      {erreur && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}

      {groupes.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-muted-foreground">
          Aucun choix : le plat a un prix unique. Ajoutez un choix pour proposer des tailles, un accompagnement ou un parfum.
        </p>
      )}

      {groupes.map((groupe) => (
        <div key={groupe.cle} className="overflow-hidden rounded-xl border border-border">
          <div className="flex flex-wrap items-end gap-3 border-b border-border bg-tuile/50 p-4">
            <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-sm font-medium text-marque-nuit">
              Nom du choix
              <input
                value={groupe.nom}
                maxLength={50}
                onChange={(evenement) => changerGroupe(groupe.cle, { nom: evenement.target.value })}
                placeholder="Taille, Accompagnement, Parfum…"
                className={classeChampCompact}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-marque-nuit">
              Présentation
              <select
                value={groupe.affichage}
                onChange={(evenement) => changerGroupe(groupe.cle, { affichage: evenement.target.value === 'LISTE' ? 'LISTE' : 'TUILES' })}
                className={classeListeCompacte}
              >
                <option value="TUILES">Boutons</option>
                <option value="LISTE">Liste déroulante</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setGroupes((liste) => liste.filter((element) => element.cle !== groupe.cle))}
              className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
              Supprimer ce choix
            </button>
          </div>

          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-border text-xs tracking-[0.15em] text-marque-nuit uppercase">
                  <th scope="col" className="px-4 py-3 font-medium">Option</th>
                  <th scope="col" className="w-44 px-4 py-3 font-medium">Supplément</th>
                  <th scope="col" className="w-28 px-4 py-3 font-medium">Photo</th>
                  <th scope="col" className="w-16 px-4 py-3 font-medium"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {groupe.options.map((option) => (
                  <tr key={option.cle} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2">
                      <input
                        value={option.nom}
                        maxLength={50}
                        aria-label="Nom de l'option"
                        onChange={(evenement) => changerOption(groupe.cle, option.cle, { nom: evenement.target.value })}
                        placeholder="1/2, Frites de plantain, Vanille…"
                        className={classeChampCompact}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <ChampMontant
                        valeur={option.supplement}
                        onChange={(supplement) => changerOption(groupe.cle, option.cle, { supplement })}
                        libelle="Supplément"
                        compact
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <label
                          title={option.photoUrl ? 'Remplacer la photo' : 'Ajouter une photo (facultatif)'}
                          className={`flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary ${photoEnCours === option.cle ? 'pointer-events-none animate-pulse' : ''}`}
                        >
                          {option.photoUrl ? <img src={option.photoUrl} alt="" className="size-full object-cover" /> : <ImagePlus className="size-4" />}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic"
                            className="sr-only"
                            onChange={(evenement) => {
                              const fichier = evenement.target.files?.[0]
                              evenement.target.value = ''
                              if (fichier) void choisirPhoto(groupe.cle, option.cle, fichier)
                            }}
                          />
                        </label>
                        {option.photoUrl && (
                          <button
                            type="button"
                            onClick={() => changerOption(groupe.cle, option.cle, { imagePublicId: null, photoUrl: null })}
                            aria-label="Retirer la photo de l'option"
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => changerGroupe(groupe.cle, { options: groupe.options.filter((element) => element.cle !== option.cle) })}
                        aria-label={`Supprimer l'option ${option.nom}`}
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

          <div className="border-t border-border px-4 py-2.5">
            <button
              type="button"
              onClick={() => changerGroupe(groupe.cle, { options: [...groupe.options, nouvelleOption()] })}
              className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              <CirclePlus className="size-4" />
              Ajouter une option
            </button>
          </div>
        </div>
      ))}

      <BarreEnregistrement
        modifie={modifie}
        enCours={enCours}
        incomplet={modifie ? incomplet : null}
        onEnregistrer={() => void enregistrer()}
        onAnnuler={() => setGroupes(initial)}
      />
    </div>
  )
}
