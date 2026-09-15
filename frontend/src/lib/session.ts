import { redirect } from 'react-router'
import type { Role, Utilisateur } from '@/types/utilisateur'
import { ErreurApi, requeteApi } from './api'
import { CLES_PERSONNEL, effacerCache } from './cacheLocal'

const ACCUEIL: Record<Role, string> = {
  ADMIN: '/admin',
  CUISINE: '/cuisine',
  SERVEUR: '/serveur',
}

export const accueilDuRole = (role: Role): string => ACCUEIL[role]

/** Page demandée avant la connexion. Seulement un chemin interne : jamais de redirection vers un autre site. */
export function retourSur(retour: string | null): string | null {
  return retour?.startsWith('/') && !retour.startsWith('//') ? retour : null
}

function versConnexion(request: Request): Response {
  const { pathname, search } = new URL(request.url)
  return redirect(`/connexion?retour=${encodeURIComponent(pathname + search)}`)
}

/**
 * À appeler dans le loader d'une page du personnel. Sans session : redirection vers /connexion, puis retour ici.
 * Le serveur revérifie le rôle à chaque requête : ce contrôle ne sert qu'à afficher la bonne page.
 */
export async function exigerSession(request: Request, roles: readonly Role[]): Promise<Utilisateur> {
  const { utilisateur } = await requeteStaff<{ utilisateur: Utilisateur }>(request, '/auth/check-auth')
  if (!roles.includes(utilisateur.role)) throw new ErreurApi(403, "Cet écran n'est pas accessible avec votre compte.")
  return utilisateur
}

/** Lecture d'API dans le loader d'une page du personnel : une session expirée renvoie vers la connexion. */
export async function requeteStaff<T>(request: Request, chemin: string): Promise<T> {
  try {
    return await requeteApi<T>(chemin)
  } catch (erreur) {
    if (erreur instanceof ErreurApi && erreur.status === 401) throw versConnexion(request)
    throw erreur
  }
}

/**
 * Efface la session côté serveur. Un échec réseau n'empêche pas de quitter l'écran : le cookie expirera de lui-même.
 * Les écrans enregistrés sur l'appareil (§7) partent avec la session.
 */
export async function deconnecter(): Promise<void> {
  try {
    await requeteApi<void>('/auth/logout', { method: 'POST' })
  } catch (probleme) {
    console.error(probleme)
  }
  await Promise.all(CLES_PERSONNEL.map((cle) => effacerCache(cle)))
}
