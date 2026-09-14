export class ErreurApi extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ErreurApi'
    this.status = status
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
    throw new ErreurApi(reponse.status, message)
  }
  return (await reponse.json()) as T
}
