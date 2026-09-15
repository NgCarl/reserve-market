export class ErreurApi extends Error {
  readonly status: number
  /** Détails renvoyés par le serveur, par exemple les articles devenus indisponibles. */
  readonly details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ErreurApi'
    this.status = status
    this.details = details
  }
}

/**
 * Appel de l'API en URL relative (CLAUDE.md §11) : même serveur en production, proxy Vite en développement.
 * Lève ErreurApi avec le message renvoyé par le serveur, ou un message réseau (status 0).
 */
export async function requeteApi<T>(chemin: string, init?: RequestInit): Promise<T> {
  let reponse: Response
  try {
    reponse = await fetch(`/api${chemin}`, { ...init, headers: { Accept: 'application/json', ...init?.headers } })
  } catch {
    throw new ErreurApi(0, 'Connexion impossible. Vérifiez votre réseau puis réessayez.')
  }

  if (!reponse.ok) {
    const corps: unknown = await reponse.json().catch(() => null)
    const message = typeof corps === 'object' && corps !== null && 'message' in corps && typeof corps.message === 'string'
      ? corps.message
      : 'Une erreur est survenue. Réessayez.'
    const details = typeof corps === 'object' && corps !== null && 'details' in corps ? corps.details : undefined
    throw new ErreurApi(reponse.status, message, details)
  }
  // 204 No Content (déconnexion) : aucun corps à lire.
  if (reponse.status === 204) return undefined as T
  return (await reponse.json()) as T
}

/** Message à afficher : la première erreur de champ renvoyée par la validation du serveur, sinon son message général. */
export function messageErreur(probleme: unknown, parDefaut: string): string {
  if (!(probleme instanceof ErreurApi)) return parDefaut
  const { details } = probleme
  if (typeof details === 'object' && details !== null && 'fieldErrors' in details && typeof details.fieldErrors === 'object' && details.fieldErrors !== null) {
    for (const messages of Object.values(details.fieldErrors)) {
      if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0]
    }
  }
  return probleme.message
}
