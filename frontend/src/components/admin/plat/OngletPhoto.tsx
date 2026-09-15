import { ImageOff, ImagePlus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DialogueConfirmation } from '@/components/admin/DialogueConfirmation'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { envoyerPhoto } from '@/lib/cloudinary'
import type { PlatAdmin } from '@/types/carte'

interface Props {
  plat: PlatAdmin
  onModifie: (plat: PlatAdmin) => void
}

/** Onglet « Photo » (maquette FoodScan « Images ») : envoi direct à Cloudinary, remplacement, retrait. */
export function OngletPhoto({ plat, onModifie }: Props) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [confirmerRetrait, setConfirmerRetrait] = useState(false)

  const choisir = async (fichier: File) => {
    setEnvoi(true)
    setErreur(null)
    try {
      const photo = await envoyerPhoto(fichier)
      // Le serveur vérifie la signature de Cloudinary avant d'enregistrer la photo.
      const { plat: misAJour } = await requeteApi<{ plat: PlatAdmin }>(
        `/plats/${plat.id}/photo`,
        enJson('PUT', { publicId: photo.public_id, version: photo.version, signature: photo.signature }),
      )
      onModifie(misAJour)
    } catch (probleme) {
      setErreur(messageErreur(probleme, "La photo n'a pas pu être enregistrée."))
      setEnvoi(false)
    }
  }

  const retirer = async () => {
    const { plat: misAJour } = await requeteApi<{ plat: PlatAdmin }>(`/plats/${plat.id}/photo`, { method: 'DELETE' })
    setConfirmerRetrait(false)
    onModifie(misAJour)
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <div className="flex aspect-[4/3] w-full max-w-[320px] items-center justify-center overflow-hidden rounded-xl bg-tuile">
        {plat.photo?.url ? (
          <img src={plat.photo.url} alt={plat.nom} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageOff className="size-8" />
            Aucune photo
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <p className="max-w-md text-sm text-muted-foreground">
          JPG, PNG, WebP ou HEIC, 10 Mo maximum. La photo est réduite automatiquement pour ne pas coûter de data aux clients.
          Préférez une photo prise de près, en lumière naturelle.
        </p>

        {erreur && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}

        <div className="flex flex-wrap gap-3">
          <label className={`flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground ${envoi ? 'pointer-events-none opacity-50' : ''}`}>
            <ImagePlus className="size-4" />
            {envoi ? 'Envoi en cours…' : plat.photo ? 'Remplacer la photo' : 'Choisir une photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              disabled={envoi}
              onChange={(evenement) => {
                const fichier = evenement.target.files?.[0]
                evenement.target.value = ''
                if (fichier) void choisir(fichier)
              }}
            />
          </label>
          {plat.photo && (
            <button
              type="button"
              onClick={() => setConfirmerRetrait(true)}
              disabled={envoi}
              className="flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Retirer la photo
            </button>
          )}
        </div>
      </div>

      <DialogueConfirmation
        key={String(confirmerRetrait)}
        ouvert={confirmerRetrait}
        titre="Retirer la photo"
        description="Le plat s'affichera sans photo sur la carte."
        libelleConfirmer="Retirer"
        onConfirmer={retirer}
        onFermer={() => setConfirmerRetrait(false)}
      />
    </div>
  )
}
