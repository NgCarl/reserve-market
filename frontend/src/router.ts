import { createBrowserRouter } from 'react-router'
import { SqueletteMenu } from '@/components/menu/SqueletteMenu'
import { PageErreur } from '@/components/PageErreur'
import { PageIntrouvable } from '@/components/PageIntrouvable'

// Une route par rôle, chargée à la demande (CLAUDE.md §8) : le téléphone du client ne télécharge
// ni l'écran cuisine, ni la saisie serveur, ni le back-office.
export const router = createBrowserRouter([
  {
    path: '/menu/:jeton',
    lazy: async () => {
      const [{ MenuPage }, { chargerMenu }] = await Promise.all([
        import('@/routes/client/MenuPage'),
        import('@/routes/client/menu.loader'),
      ])
      return { Component: MenuPage, loader: chargerMenu }
    },
    // Affiché au premier chargement, pendant que le code de la page et le menu arrivent.
    HydrateFallback: SqueletteMenu,
    ErrorBoundary: PageErreur,
  },
  {
    path: '/cuisine',
    lazy: async () => ({ Component: (await import('@/routes/cuisine/CuisinePage')).CuisinePage }),
    ErrorBoundary: PageErreur,
  },
  {
    path: '/serveur',
    lazy: async () => ({ Component: (await import('@/routes/serveur/ServeurPage')).ServeurPage }),
    ErrorBoundary: PageErreur,
  },
  {
    path: '/admin',
    lazy: async () => ({ Component: (await import('@/routes/admin/AdminPage')).AdminPage }),
    ErrorBoundary: PageErreur,
  },
  {
    path: '*',
    Component: PageIntrouvable,
  },
])
