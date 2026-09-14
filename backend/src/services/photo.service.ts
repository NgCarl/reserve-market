import { createHash, timingSafeEqual } from 'node:crypto'
import { cloudinary } from '../lib/cloudinary.js'
import { env } from '../lib/env.js'

// Envoi direct : le navigateur de l'admin envoie la photo à Cloudinary, avec des paramètres signés
// ici. Le navigateur doit renvoyer exactement ces valeurs, sinon Cloudinary refuse l'envoi.
// https://cloudinary.com/documentation/authentication_signatures

// asset_folder (dossiers dynamiques) : range la photo sans modifier son public_id ni son URL.
const DOSSIER_PLATS = 'reserve-market/plats'
const FORMATS_ACCEPTES = 'jpg,jpeg,png,webp,heic'
// Appliquée à l'arrivée : la photo stockée ne dépasse pas 1600 px de côté.
const TRANSFORMATION_ENTREE = 'c_limit,w_1600,h_1600'

/** Autorisation d'envoi, valable une heure à partir du timestamp. */
export function signerEnvoiPhoto() {
  const parametres = {
    timestamp: Math.round(Date.now() / 1000),
    asset_folder: DOSSIER_PLATS,
    allowed_formats: FORMATS_ACCEPTES,
    transformation: TRANSFORMATION_ENTREE,
  }
  return {
    url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    champs: {
      ...parametres,
      api_key: env.CLOUDINARY_API_KEY,
      signature: cloudinary.utils.api_sign_request(parametres, env.CLOUDINARY_API_SECRET),
    },
  }
}

/**
 * Vérifie que public_id et version viennent bien d'une réponse de Cloudinary, et non d'un
 * navigateur qui les aurait inventés. Même calcul que la signature d'envoi : paramètres triés,
 * joints par &, secret ajouté, SHA-1. Comparaison en temps constant.
 */
export function photoAuthentique(publicId: string, version: number, signature: string): boolean {
  const attendue = createHash('sha1')
    .update(`public_id=${publicId}&version=${version}${env.CLOUDINARY_API_SECRET}`)
    .digest('hex')
  const recue = Buffer.from(signature)
  return recue.length === attendue.length && timingSafeEqual(recue, Buffer.from(attendue))
}

/** URL d'affichage allégée pour mobile (CLAUDE.md §8) : format et qualité automatiques, 400 px. */
export function urlPhoto(publicId: string | null): string | null {
  if (!publicId) return null
  return cloudinary.url(publicId, { width: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' })
}

/** Vignette carrée recadrée sur le sujet : puces de catégorie (80 px), cartes de compléments (200 px). */
export function urlVignette(publicId: string | null, taille = 80): string | null {
  if (!publicId) return null
  return cloudinary.url(publicId, { width: taille, height: taille, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' })
}

/** Aperçu de 24 px très flouté (quelques centaines d'octets), affiché pendant le chargement de la photo (§8). */
export function urlPhotoFloue(publicId: string | null): string | null {
  if (!publicId) return null
  return cloudinary.url(publicId, { width: 24, crop: 'limit', quality: 30, effect: 'blur:200', fetch_format: 'auto' })
}

/** Suppression sans bloquer la réponse : une photo orpheline sur Cloudinary ne casse rien. */
export function supprimerPhoto(publicId: string): void {
  cloudinary.uploader
    .destroy(publicId, { invalidate: true })
    // destroy ne lève pas d'erreur si la photo est introuvable : il renvoie { result: 'not found' }.
    .then((reponse: { result?: string }) => {
      if (reponse.result !== 'ok') console.error(`Suppression Cloudinary non effectuée pour ${publicId} :`, reponse.result)
    })
    .catch((error: unknown) => {
      console.error(`Suppression Cloudinary échouée pour ${publicId}`, error)
    })
}
