import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { ErreurApi } from '@/lib/api'
import { deconnecter } from '@/lib/session'

/** Affichée si une page plante, si son code ne se télécharge pas (réseau coupé) ou si l'API refuse. */
export function PageErreur() {
  const erreur = useRouteError()
  const navigate = useNavigate()
  // Écran d'un autre rôle (un cuisinier sur /admin) : proposer de changer de compte plutôt que de réessayer.
  const accesRefuse = erreur instanceof ErreurApi && erreur.status === 403
  const message = erreur instanceof ErreurApi
    ? erreur.message
    : isRouteErrorResponse(erreur)
      ? `Erreur ${erreur.status}`
      : 'La page n\'a pas pu se charger. Vérifiez votre connexion.'
  if (!(erreur instanceof ErreurApi)) console.error(erreur)

  const changerDeCompte = async () => {
    await deconnecter()
    await navigate('/connexion', { replace: true })
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold text-marque-nuit">{accesRefuse ? 'Accès refusé' : 'Oups'}</h1>
      <p className="max-w-sm text-muted-foreground">{message}</p>
      {accesRefuse ? (
        <button
          type="button"
          onClick={() => void changerDeCompte()}
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          Changer de compte
        </button>
      ) : (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          Réessayer
        </button>
      )}
    </main>
  )
}
