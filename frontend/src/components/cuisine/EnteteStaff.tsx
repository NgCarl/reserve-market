import { LogOut, Volume2, VolumeX } from 'lucide-react'
import { useNavigate } from 'react-router'
import logo from '@/assets/logo-reserve-market.webp'
import { requeteApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Utilisateur } from '@/types/utilisateur'

interface Props {
  utilisateur: Utilisateur
  /** Écrans en temps réel uniquement : état de la connexion Socket.io. */
  connecte?: boolean
  sonActive?: boolean
  onBasculerSon?: () => void
}

/** En-tête des écrans du personnel (maquette FoodScan) : logo, état de la connexion et son (écran cuisine), profil. */
export function EnteteStaff({ utilisateur, connecte, sonActive = false, onBasculerSon }: Props) {
  const navigate = useNavigate()

  const deconnecter = async () => {
    try {
      await requeteApi<void>('/auth/logout', { method: 'POST' })
    } catch (probleme) {
      // Le cookie expirera de lui-même : on quitte l'écran quoi qu'il arrive.
      console.error(probleme)
    }
    await navigate('/connexion', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-border/60 bg-white px-4 sm:px-5">
      <img src={logo} alt="Réserve Market" width={118} height={48} className="h-10 w-auto sm:h-11" />

      <div className="flex items-center gap-2 sm:gap-3">
        {connecte !== undefined && (
          <span
            role="status"
            className={cn(
              'flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold',
              connecte ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800',
            )}
          >
            <span className={cn('size-2.5 rounded-full', connecte ? 'bg-emerald-500' : 'animate-pulse bg-amber-500')} />
            <span className="hidden sm:inline">{connecte ? 'En direct' : 'Reconnexion…'}</span>
          </span>
        )}

        {onBasculerSon && (
          <button
            type="button"
            onClick={onBasculerSon}
            aria-pressed={sonActive}
            className={cn(
              'flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors',
              // Son coupé : bouton jaune bien visible, à activer au début du service.
              sonActive ? 'bg-primary/10 text-primary' : 'bg-marque-jaune text-marque-nuit',
            )}
          >
            {sonActive ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            <span className="hidden md:inline">{sonActive ? 'Son activé' : 'Activer le son'}</span>
          </button>
        )}

        <div className="flex items-center gap-2.5 pl-1">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground" aria-hidden="true">
            {utilisateur.nom.charAt(0).toLocaleUpperCase('fr')}
          </span>
          <div className="hidden leading-tight lg:block">
            <p className="text-sm text-muted-foreground">Bonjour</p>
            <p className="font-semibold text-marque-nuit">{utilisateur.nom}</p>
          </div>
          <button
            type="button"
            onClick={() => void deconnecter()}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-tuile hover:text-marque-nuit"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
