import { Info, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { formaterPrix } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Disposition } from '@/stores/preferences'
import type { PlatMenu } from '@/types/menu'
import { PhotoPlat } from './PhotoPlat'

interface Props {
  plat: PlatMenu
  disposition: Disposition
  afficherPhoto: boolean
  onOuvrir: (plat: PlatMenu) => void
}

/**
 * Carte de plat, maquette FoodScan « menu » :
 * liste = photo à gauche, description sur 2 lignes ; grille = photo en haut, description sur 4 lignes.
 */
export function CartePlat({ plat, disposition, afficherPhoto, onOuvrir }: Props) {
  const grille = disposition === 'grille'
  const avecPhoto = afficherPhoto && plat.photoUrl !== null

  return (
    <button
      type="button"
      onClick={() => onOuvrir(plat)}
      disabled={!plat.disponible}
      className={cn(
        'flex w-full overflow-hidden rounded-2xl border border-border bg-card text-left transition-transform',
        grille ? 'flex-col' : 'flex-row',
        !grille && avecPhoto && 'min-h-36',
        plat.disponible ? 'active:scale-[0.99]' : 'opacity-60',
      )}
    >
      {avecPhoto && plat.photoUrl ? (
        <PhotoPlat
          url={plat.photoUrl}
          floueUrl={plat.photoFloueUrl}
          alt=""
          className={grille ? 'aspect-[4/3] w-full' : 'w-[38%] shrink-0 self-stretch'}
        />
      ) : (
        // En grille, un emplacement neutre garde toutes les cartes alignées quand un article n'a pas de photo.
        grille && afficherPhoto && (
          <span aria-hidden="true" className="flex aspect-[4/3] w-full items-center justify-center bg-tuile">
            <UtensilsCrossed className="size-9 text-muted-foreground/40" />
          </span>
        )
      )}
      <span className={cn('flex min-w-0 flex-1 flex-col gap-1.5', grille ? 'p-3' : 'p-3.5')}>
        <span className="flex items-start justify-between gap-1.5">
          <span className={cn('leading-snug font-bold text-marque-nuit', grille ? 'line-clamp-1 text-[15px]' : 'text-[17px]')}>
            {plat.nom}
          </span>
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 fill-muted-foreground text-white" />
        </span>
        {plat.description && (
          <span className={cn('text-sm leading-snug text-muted-foreground', grille ? 'line-clamp-4' : 'line-clamp-2')}>
            {plat.description}
          </span>
        )}
        <span className="mt-auto flex items-end justify-between gap-1.5 pt-2">
          <span className="flex min-w-0 flex-col">
            {plat.groupesVariantes.length > 0 && <span className="text-[11px] font-medium text-muted-foreground">à partir de</span>}
            <span className={cn('leading-tight font-bold whitespace-nowrap text-marque-nuit', grille ? 'text-[15px]' : 'text-lg')}>
              {formaterPrix(plat.prix)}
            </span>
          </span>
          {plat.disponible ? (
            <span
              aria-hidden="true"
              className={cn(
                'flex shrink-0 items-center rounded-full bg-white font-semibold text-primary shadow-[0_2px_10px_rgba(3,40,66,0.14)]',
                grille ? 'size-8 justify-center' : 'h-9 gap-1 px-3.5 text-sm',
              )}
            >
              <ShoppingBag className="size-4" />
              {/* En grille, la carte est trop étroite pour le prix et le libellé : pastille icône seule. */}
              {!grille && 'Ajouter'}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-tuile px-2.5 py-1 text-xs font-semibold text-muted-foreground">Épuisé</span>
          )}
        </span>
      </span>
    </button>
  )
}
