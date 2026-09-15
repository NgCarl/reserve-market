import { createBrowserRouter } from 'react-router'
import { SqueletteMenu } from '@/components/menu/SqueletteMenu'
import { PageChargement } from '@/components/PageChargement'
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
        path: 'commandes',
        lazy: async () => {
          const [{ MesCommandesPage }, { chargerCommandesTable }] = await Promise.all([
            import('@/routes/client/MesCommandesPage'),
            import('@/routes/client/commande.loader'),
          ])
          return { Component: MesCommandesPage, loader: chargerCommandesTable }
        },
        ErrorBoundary: PageErreur,
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
    path: '/connexion',
    lazy: async () => ({ Component: (await import('@/routes/connexion/ConnexionPage')).ConnexionPage }),
    ErrorBoundary: PageErreur,
  },
  {
    path: '/cuisine',
    lazy: async () => {
      const [{ CuisinePage }, { chargerCuisine }] = await Promise.all([
        import('@/routes/cuisine/CuisinePage'),
        import('@/routes/cuisine/cuisine.loader'),
      ])
      return { Component: CuisinePage, loader: chargerCuisine }
    },
    HydrateFallback: PageChargement,
    ErrorBoundary: PageErreur,
  },
  {
    path: '/serveur',
    lazy: async () => ({ Component: (await import('@/routes/serveur/ServeurPage')).ServeurPage }),
    ErrorBoundary: PageErreur,
  },
  {
    path: '/admin',
    lazy: async () => {
      const [{ PersonnelPage }, { chargerPersonnel }] = await Promise.all([
        import('@/routes/admin/PersonnelPage'),
        import('@/routes/admin/admin.loader'),
      ])
      return { Component: PersonnelPage, loader: chargerPersonnel }
    },
    HydrateFallback: PageChargement,
    ErrorBoundary: PageErreur,
  },
  {
    path: '*',
    Component: PageIntrouvable,
  },
])
