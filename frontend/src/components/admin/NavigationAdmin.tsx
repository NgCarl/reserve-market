import { ChefHat, Layers, QrCode, Users, UtensilsCrossed } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

// Une section par usage, dans l'ordre de la journée : préparer le restaurant, gérer l'équipe, suivre le service.
// Les autres pages (carte, commandes du jour, tableau de bord) s'ajoutent ici au fil de l'étape 7.
const SECTIONS: { titre: string; liens: { vers: string; libelle: string; Icone: typeof Users }[] }[] = [
  { titre: 'Restaurant', liens: [{ vers: '/admin/tables', libelle: 'Tables et QR codes', Icone: QrCode }] },
  {
    titre: 'Carte',
    liens: [
      { vers: '/admin/plats', libelle: 'Plats', Icone: UtensilsCrossed },
      { vers: '/admin/categories', libelle: 'Catégories', Icone: Layers },
    ],
  },
  { titre: 'Équipe', liens: [{ vers: '/admin/personnel', libelle: 'Personnel', Icone: Users }] },
  { titre: 'Service', liens: [{ vers: '/cuisine', libelle: 'Écran cuisine', Icone: ChefHat }] },
]

interface Props {
  /** Ferme le menu du téléphone après un choix. */
  onNaviguer?: () => void
}

/** Menu du back-office, le même sur ordinateur (colonne) et sur téléphone (panneau). */
export function NavigationAdmin({ onNaviguer }: Props) {
  return (
    <nav aria-label="Menu du back-office" className="flex flex-col gap-6">
      {SECTIONS.map((section) => (
        <div key={section.titre} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">{section.titre}</p>
          {section.liens.map(({ vers, libelle, Icone }) => (
            <NavLink
              key={vers}
              to={vers}
              onClick={onNaviguer}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors',
                  isActive ? 'bg-primary/10 font-medium text-primary' : 'text-marque-nuit hover:bg-tuile',
                )}
            >
              <Icone className="size-[18px] shrink-0" />
              {libelle}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
