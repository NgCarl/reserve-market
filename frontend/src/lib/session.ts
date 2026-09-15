import { redirect } from 'react-router'
import type { Role, Utilisateur } from '@/types/utilisateur'
import { ErreurApi, requeteApi } from './api'

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

/**
 * À appeler dans le loader d'une page du personnel. Sans session : redirection vers /connexion, puis retour ici.
 * Le serveur revérifie le rôle à chaque requête : ce contrôle ne sert qu'à afficher la bonne page.
 */
export async function exigerSession(request: Request, roles: readonly Role[]): Promise<Utilisateur> {
  let utilisateur: Utilisateur
  try {
    ;({ utilisateur } = await requeteApi<{ utilisateur: Utilisateur }>('/auth/check-auth'))
  } catch (erreur) {
    if (erreur instanceof ErreurApi && erreur.status === 401) {
      const { pathname, search } = new URL(request.url)
      throw redirect(`/connexion?retour=${encodeURIComponent(pathname + search)}`)
    }
    throw erreur
  }
  if (!roles.includes(utilisateur.role)) throw new ErreurApi(403, "Cet écran n'est pas accessible avec votre compte.")
  return utilisateur
}
