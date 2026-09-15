import type { Role, Utilisateur } from '@/types/utilisateur'
import { ErreurApi } from './api'
import { ecrireCache, lireCache, type ClePersonnel } from './cacheLocal'
import { exigerSession } from './session'

export interface EcranPersonnel<T> {
  utilisateur: Utilisateur
  donnees: T
  /** Date.now() de la dernière réception des données depuis le serveur. */
  recuLe: number
  /** Données reprises de l'appareil, faute de réseau. */
  horsLigne: boolean
}

export interface EcranEnregistre<T> {
  utilisateur: Utilisateur
  donnees: T
}

/**
 * Loader d'un écran du personnel qui résiste aux coupures (CLAUDE.md §7).
 * En ligne : vérifie la session, lit l'API et enregistre le résultat sur l'appareil.
 * Sans réseau : reprend la dernière version enregistrée, si elle appartient à un rôle autorisé sur cet écran.
 * Une session expirée (401) ou un rôle refusé (403) ne passent jamais par le cache.
 */
export async function chargerEcranPersonnel<T>(
  request: Request,
  cle: ClePersonnel,
  roles: readonly Role[],
  lire: () => Promise<T>,
): Promise<EcranPersonnel<T>> {
  try {
    const [utilisateur, donnees] = await Promise.all([exigerSession(request, roles), lire()])
    void ecrireCache<EcranEnregistre<T>>(cle, { utilisateur, donnees })
    return { utilisateur, donnees, recuLe: Date.now(), horsLigne: false }
  } catch (probleme) {
    if (!(probleme instanceof ErreurApi && probleme.status === 0)) throw probleme
    const enregistre = await lireCache<EcranEnregistre<T>>(cle)
    if (!enregistre || !roles.includes(enregistre.valeur.utilisateur.role)) throw probleme
    return { ...enregistre.valeur, recuLe: enregistre.enregistreLe, horsLigne: true }
  }
}
