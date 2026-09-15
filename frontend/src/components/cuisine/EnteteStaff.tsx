import { LayoutDashboard, LogOut, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import logo from '@/assets/logo-reserve-market.webp'
import { useApplicationPersonnel } from '@/hooks/useApplicationPersonnel'
import { useDeconnexionInactivite } from '@/hooks/useDeconnexionInactivite'
import { LIBELLES_ROLE } from '@/lib/roles'
import { accueilDuRole, deconnecter } from '@/lib/session'
import { cn } from '@/lib/utils'
import type { Utilisateur } from '@/types/utilisateur'

interface Props {
  utilisateur: Utilisateur
  /** Écrans en temps réel uniquement : état de la connexion Socket.io. */
  connecte?: boolean
  sonActive?: boolean
  onBasculerSon?: () => void
  /** Bouton d'ouverture du menu (back-office sur téléphone), placé avant le logo. */
  menu?: ReactNode
  /** Admin sur un écran de service : accès direct au back-office. */
  lienBackOffice?: boolean
}

/** En-tête commun aux écrans du personnel (maquette FoodScan) : logo, raccourcis, profil et déconnexion. */
export function EnteteStaff({ utilisateur, connecte, sonActive = false, onBasculerSon, menu, lienBackOffice = false }: Props) {
  const navigate = useNavigate()
  // L'en-tête est présent sur tous les écrans du personnel : la surveillance suit l'admin partout (back-office, cuisine).
  useDeconnexionInactivite(utilisateur.role === 'ADMIN')
  const miseAJour = useApplicationPersonnel()

  const quitter = async () => {
    await deconnecter()
    await navigate('/connexion', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-2 border-b border-border/60 bg-white px-3 sm:px-5 print:hidden">
      <div className="flex min-w-0 items-center gap-1.5">
        {menu}
        <Link to={accueilDuRole(utilisateur.role)} aria-label="Accueil de mon espace" className="shrink-0">
          <img src={logo} alt="Réserve Market" width={118} height={48} className="h-10 w-auto sm:h-11" />
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {lienBackOffice && (
          <Link
            to="/admin"
            title="Back-office"
            className="flex h-10 items-center gap-2 rounded-lg bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <LayoutDashboard className="size-5" />
            <span className="hidden md:inline">Back-office</span>
          </Link>
        )}

        {miseAJour && (
          <button
            type="button"
            onClick={miseAJour}
            title="Une nouvelle version est disponible"
            className="flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white"
          >
            <RefreshCw className="size-5" />
            <span className="hidden sm:inline">Mettre à jour</span>
          </button>
        )}

        {connecte !== undefined && (
          <span
            role="status"
            title={connecte ? 'En direct' : 'Reconnexion…'}
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
            title={sonActive ? 'Son activé' : 'Activer le son'}
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

        <div className="flex items-center gap-2 border-l border-border pl-2 sm:gap-2.5 sm:pl-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground" aria-hidden="true">
            {utilisateur.nom.charAt(0).toLocaleUpperCase('fr')}
          </span>
          <div className="hidden leading-tight lg:block">
            <p className="font-semibold text-marque-nuit">{utilisateur.nom}</p>
            {/* Pas de répétition quand le nom du compte est déjà son rôle (« Administrateur »). */}
            {utilisateur.nom !== LIBELLES_ROLE[utilisateur.role] && (
              <p className="text-sm text-muted-foreground">{LIBELLES_ROLE[utilisateur.role]}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void quitter()}
            title="Déconnexion"
            className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-tuile hover:text-marque-nuit"
          >
            <LogOut className="size-5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  )
}
