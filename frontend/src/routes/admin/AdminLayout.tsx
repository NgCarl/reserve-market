import { Menu } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Link, Outlet, useMatches } from 'react-router'
import logo from '@/assets/logo-reserve-market.webp'
import { NavigationAdmin } from '@/components/admin/NavigationAdmin'
import { EnteteStaff } from '@/components/cuisine/EnteteStaff'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useAdmin } from '@/hooks/useAdmin'
import { cn } from '@/lib/utils'

interface EtapeFil {
  libelle: string
  /** Lien de retour ; absent pour la page courante. */
  vers?: string
}

/** Fil d'Ariane déclaré par chaque route dans handle.fil (router.ts). */
const aUnFil = (handle: unknown): handle is { fil: EtapeFil[] } =>
  typeof handle === 'object' && handle !== null && 'fil' in handle && Array.isArray(handle.fil)

/** Structure du back-office (maquette FoodScan) : en-tête, menu latéral (panneau sur téléphone), fil d'Ariane, page. */
export function AdminLayout() {
  const utilisateur = useAdmin()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const fil = useMatches().map((route) => route.handle).filter(aUnFil).at(-1)?.fil ?? []

  return (
    <div className="min-h-dvh bg-[#f5f6fa] print:bg-white">
      <EnteteStaff
        utilisateur={utilisateur}
        menu={(
          <button
            type="button"
            onClick={() => setMenuOuvert(true)}
            aria-label="Ouvrir le menu"
            className="flex size-10 items-center justify-center rounded-lg text-marque-nuit hover:bg-tuile lg:hidden"
          >
            <Menu className="size-6" />
          </button>
        )}
      />

      <Sheet open={menuOuvert} onOpenChange={setMenuOuvert}>
        <SheetContent side="left" className="w-[280px] gap-0 p-0 data-[side=left]:w-[280px]">
          <div className="flex h-[68px] items-center border-b border-border px-5">
            <img src={logo} alt="Réserve Market" width={118} height={48} className="h-10 w-auto" />
          </div>
          <SheetTitle className="sr-only">Menu du back-office</SheetTitle>
          <SheetDescription className="sr-only">Pages du back-office</SheetDescription>
          <div className="overflow-y-auto p-4">
            <NavigationAdmin onNaviguer={() => setMenuOuvert(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex">
        <aside className="sticky top-[68px] hidden h-[calc(100dvh-68px)] w-[260px] shrink-0 overflow-y-auto border-r border-border/60 bg-white p-4 lg:block print:hidden">
          <NavigationAdmin />
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-5 print:p-0">
          <nav aria-label="Fil d'Ariane" className="mb-5 print:hidden">
            <ol className="flex flex-wrap items-center gap-x-2 text-xl text-marque-nuit sm:text-2xl">
              <li>
                <Link to="/admin" className="transition-colors hover:text-primary">Tableau de bord</Link>
              </li>
              {fil.map((etape, index) => {
                const courante = index === fil.length - 1
                return (
                  <Fragment key={etape.libelle}>
                    <li aria-hidden="true" className="text-muted-foreground">/</li>
                    <li>
                      {etape.vers && !courante ? (
                        <Link to={etape.vers} className="transition-colors hover:text-primary">{etape.libelle}</Link>
                      ) : (
                        <span aria-current={courante ? 'page' : undefined} className={cn(courante && 'text-muted-foreground')}>{etape.libelle}</span>
                      )}
                    </li>
                  </Fragment>
                )
              })}
            </ol>
          </nav>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
