import { createBrowserRouter } from 'react-router'
import { SqueletteMenu } from '@/components/menu/SqueletteMenu'
import { PageErreur } from '@/components/PageErreur'
import { PageIntrouvable } from '@/components/PageIntrouvable'

// Une route par rôle, chargée à la demande (CLAUDE.md §8) : le téléphone du client ne télécharge
// ni l'écran cuisine, ni la saisie serveur, ni le back-office.
export const router = createBrowserRouter([
  {
    // Route parente du client : charge le menu une fois, partagé par la carte, la validation et le suivi.
    id: 'menu',
    path: '/menu/:jeton',
    lazy: async () => ({ loader: (await import('@/routes/client/menu.loader')).chargerMenu }),
    // Le menu n'est rechargé que si l'on change de table (sinon chaque actualisation du suivi le retéléchargerait).
    shouldRevalidate: ({ currentParams, nextParams }) => currentParams.jeton !== nextParams.jeton,
    // Affiché au premier chargement, pendant que le code de la page et le menu arrivent.
    HydrateFallback: SqueletteMenu,
    ErrorBoundary: PageErreur,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('@/routes/client/MenuPage')).MenuPage }),
      },
      {
        path: 'commande',
        lazy: async () => ({ Component: (await import('@/routes/client/ValidationPage')).ValidationPage }),
      },
      {
        path: 'commandes/:commandeId',
        lazy: async () => {
          const [{ SuiviPage }, { chargerCommande }] = await Promise.all([
            import('@/routes/client/SuiviPage'),
            import('@/routes/client/commande.loader'),
          ])
          return { Component: SuiviPage, loader: chargerCommande }
        },
        ErrorBoundary: PageErreur,
      },
    ],
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
