import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ErreurApi } from '@/lib/api'

/** Affichée si une page plante, si son code ne se télécharge pas (réseau coupé) ou si l'API refuse. */
export function PageErreur() {
  const erreur = useRouteError()
  const message = erreur instanceof ErreurApi
    ? erreur.message
    : isRouteErrorResponse(erreur)
      ? `Erreur ${erreur.status}`
      : 'La page n\'a pas pu se charger. Vérifiez votre connexion.'
  if (!(erreur instanceof ErreurApi)) console.error(erreur)

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Oups</h1>
      <p className="max-w-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground"
      >
        Réessayer
      </button>
    </main>
  )
}
