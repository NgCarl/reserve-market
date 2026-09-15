import { ChefHat, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { EnteteStaff } from '@/components/cuisine/EnteteStaff'
import { cn } from '@/lib/utils'
import type { Utilisateur } from '@/types/utilisateur'

// Menu du back-office, groupé comme celui de FoodScan. Les autres pages arrivent à l'étape 7.
const GROUPES: { titre: string; liens: { vers: string; libelle: string; Icone: typeof Users }[] }[] = [
  { titre: 'Utilisateurs', liens: [{ vers: '/admin', libelle: 'Personnel', Icone: Users }] },
  { titre: 'Service', liens: [{ vers: '/cuisine', libelle: 'Écran cuisine', Icone: ChefHat }] },
]

interface Props {
  utilisateur: Utilisateur
  titre: string
  children: ReactNode
}

export function MiseEnPageAdmin({ utilisateur, titre, children }: Props) {
  return (
    <div className="min-h-dvh bg-[#f5f6fa]">
      <EnteteStaff utilisateur={utilisateur} />
      <div className="lg:flex">
        <nav
          aria-label="Menu du back-office"
          className="flex gap-2 overflow-x-auto bg-white px-4 py-3 lg:sticky lg:top-[68px] lg:h-[calc(100dvh-68px)] lg:w-[260px] lg:shrink-0 lg:flex-col lg:gap-0 lg:overflow-y-auto"
        >
          {GROUPES.map((groupe) => (
            <div key={groupe.titre} className="flex gap-2 lg:flex-col lg:gap-1">
              <p className="hidden pt-3 pb-1 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase lg:block">{groupe.titre}</p>
              {groupe.liens.map(({ vers, libelle, Icone }) => (
                <NavLink
                  key={vers}
                  to={vers}
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-[15px] whitespace-nowrap transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-marque-nuit hover:bg-tuile',
                    )}
                >
                  <Icone className="size-4" />
                  {libelle}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1 p-4 sm:p-5">
          <p className="mb-5 text-2xl text-marque-nuit">
            Tableau de bord <span className="text-muted-foreground">/ {titre}</span>
          </p>
          {children}
        </main>
      </div>
    </div>
  )
}
