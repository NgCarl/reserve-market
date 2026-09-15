import { ChevronRight, ClipboardList } from 'lucide-react'
import { Link } from 'react-router'
import { LIBELLES_STATUT } from '@/lib/statut'
import type { CommandeSuivie } from '@/types/commande'

interface Props {
  jeton: string
  /** Du plus récent au plus ancien. */
  commandes: CommandeSuivie[]
}

/** Accès au suivi depuis la carte, en haut de page, dès que la table a une commande en cours de service. */
export function BandeauCommandes({ jeton, commandes }: Props) {
  const derniere = commandes[0]
  if (!derniere) return null
  const plusieurs = commandes.length > 1

  return (
    <Link
      to={plusieurs ? `/menu/${jeton}/commandes` : `/menu/${jeton}/commandes/${derniere.id}`}
      className="mx-4 mt-3 flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-[0_6px_18px_rgba(21,86,167,0.25)] transition-transform active:scale-[0.99]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15" aria-hidden="true">
        <ClipboardList className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="font-bold">
          {plusieurs ? `Suivre mes ${commandes.length} commandes` : `Suivre ma commande n° ${derniere.id}`}
        </span>
        <span className="text-sm text-white/85">
          {plusieurs ? `Dernière : n° ${derniere.id} · ${LIBELLES_STATUT[derniere.statut]}` : LIBELLES_STATUT[derniere.statut]}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0" />
    </Link>
  )
}
