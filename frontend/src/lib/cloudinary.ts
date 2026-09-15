import { ErreurApi, requeteApi } from './api'

/** Limite de l'offre gratuite de Cloudinary pour une image. */
const TAILLE_MAX_OCTETS = 10 * 1024 * 1024

interface AutorisationEnvoi {
  url: string
  champs: Record<string, string | number>
}

export interface PhotoEnvoyee {
  public_id: string
  version: number
  signature: string
  secure_url: string
}

const estPhotoEnvoyee = (corps: unknown): corps is PhotoEnvoyee =>
  typeof corps === 'object' && corps !== null
  && 'public_id' in corps && typeof corps.public_id === 'string'
  && 'version' in corps && typeof corps.version === 'number'
  && 'signature' in corps && typeof corps.signature === 'string'
  && 'secure_url' in corps && typeof corps.secure_url === 'string'

function messageCloudinary(corps: unknown): string | null {
  if (typeof corps !== 'object' || corps === null || !('error' in corps)) return null
  const { error } = corps
  return typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message : null
}

/**
 * Envoi direct du navigateur vers Cloudinary, avec les champs signés par le serveur (POST /api/plats/photo/signature).
 * La réponse (public_id, version, signature) est ensuite transmise à l'API, qui vérifie la signature.
 */
export async function envoyerPhoto(fichier: File): Promise<PhotoEnvoyee> {
  if (fichier.size > TAILLE_MAX_OCTETS) throw new ErreurApi(0, 'Photo trop lourde : 10 Mo maximum.')

  const { url, champs } = await requeteApi<AutorisationEnvoi>('/plats/photo/signature', { method: 'POST' })
  const formulaire = new FormData()
  // Exactement les champs signés, sinon Cloudinary refuse l'envoi.
  for (const [cle, valeur] of Object.entries(champs)) formulaire.append(cle, String(valeur))
  formulaire.append('file', fichier)

  let reponse: Response
  try {
    reponse = await fetch(url, { method: 'POST', body: formulaire })
  } catch {
    throw new ErreurApi(0, "La photo n'a pas pu être envoyée. Vérifiez la connexion puis réessayez.")
  }
  const corps: unknown = await reponse.json().catch(() => null)
  if (!reponse.ok || !estPhotoEnvoyee(corps)) {
    const detail = messageCloudinary(corps)
    throw new ErreurApi(reponse.status, `Photo refusée${detail ? ` : ${detail}` : '. Formats acceptés : JPG, PNG, WebP, HEIC.'}`)
  }
  return corps
}
