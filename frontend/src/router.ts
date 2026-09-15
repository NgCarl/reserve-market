import { createBrowserRouter, redirect, type ShouldRevalidateFunction } from 'react-router'
import { SqueletteMenu } from '@/components/menu/SqueletteMenu'
import { PageChargement } from '@/components/PageChargement'
import { PageErreur } from '@/components/PageErreur'
import { PageIntrouvable } from '@/components/PageIntrouvable'

/**
 * Filtres et onglets du back-office vivent dans l'URL (?categorie=, ?onglet=) : les changer ne relit pas l'API,
 * sinon chaque clic attendrait le serveur. Une revalidation après un enregistrement garde la même URL et recharge.
 */
const sansRechargementPourParametres: ShouldRevalidateFunction = ({ currentUrl, nextUrl, defaultShouldRevalidate }) =>
  currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search ? false : defaultShouldRevalidate

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
    // Au lancement du site : la porte d'entrée du personnel. Les clients arrivent directement par /menu/:jeton.
    path: '/',
    loader: () => redirect('/connexion'),
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
    lazy: async () => {
      const [{ ServeurPage }, { chargerServeur }] = await Promise.all([
        import('@/routes/serveur/ServeurPage'),
        import('@/routes/serveur/serveur.loader'),
      ])
      return { Component: ServeurPage, loader: chargerServeur }
    },
    HydrateFallback: PageChargement,
    ErrorBoundary: PageErreur,
  },
  {
    // Back-office : la route parente vérifie le rôle ADMIN et affiche le menu ; chaque page déclare son fil d'Ariane.
    id: 'admin',
    path: '/admin',
    shouldRevalidate: sansRechargementPourParametres,
    lazy: async () => {
      const [{ AdminLayout }, { chargerAdmin }] = await Promise.all([
        import('@/routes/admin/AdminLayout'),
        import('@/routes/admin/admin.loader'),
      ])
      return { Component: AdminLayout, loader: chargerAdmin }
    },
    HydrateFallback: PageChargement,
    ErrorBoundary: PageErreur,
    children: [
      {
        index: true,
        handle: { fil: [] },
        HydrateFallback: PageChargement,
        lazy: async () => {
          const [{ TableauDeBordPage }, { chargerTableauDeBord }] = await Promise.all([
            import('@/routes/admin/TableauDeBordPage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: TableauDeBordPage, loader: chargerTableauDeBord }
        },
        ErrorBoundary: PageErreur,
      },
      {
        path: 'commandes',
        handle: { fil: [{ libelle: 'Commandes du jour' }] },
        HydrateFallback: PageChargement,
        lazy: async () => {
          const [{ CommandesPage }, { chargerCommandesJour }] = await Promise.all([
            import('@/routes/admin/CommandesPage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: CommandesPage, loader: chargerCommandesJour }
        },
        ErrorBoundary: PageErreur,
      },
      {
        path: 'commandes/:commandeId',
        handle: { fil: [{ libelle: 'Commandes du jour', vers: '/admin/commandes' }, { libelle: 'Détail' }] },
        HydrateFallback: PageChargement,
        lazy: async () => {
          const [{ CommandePage }, { chargerCommandeAdmin }] = await Promise.all([
            import('@/routes/admin/CommandePage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: CommandePage, loader: chargerCommandeAdmin }
        },
        ErrorBoundary: PageErreur,
      },
      {
        path: 'tables',
        handle: { fil: [{ libelle: 'Tables et QR codes' }] },
        HydrateFallback: PageChargement,
        lazy: async () => {
          const [{ TablesPage }, { chargerTables }] = await Promise.all([
            import('@/routes/admin/TablesPage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: TablesPage, loader: chargerTables }
        },
        ErrorBoundary: PageErreur,
      },
      {
        path: 'tables/qr',
        handle: { fil: [{ libelle: 'Tables et QR codes', vers: '/admin/tables' }, { libelle: 'Impression des QR' }] },
        HydrateFallback: PageChargement,
        lazy: async () => {
          const [{ QrTablesPage }, { chargerTables }] = await Promise.all([
            import('@/routes/admin/QrTablesPage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: QrTablesPage, loader: chargerTables }
        },
        ErrorBoundary: PageErreur,
      },
      {
        path: 'tables/:tableId',
        handle: { fil: [{ libelle: 'Tables et QR codes', vers: '/admin/tables' }, { libelle: 'QR code' }] },
        HydrateFallback: PageChargement,
        lazy: async () => {
          const [{ TablePage }, { chargerTable }] = await Promise.all([
            import('@/routes/admin/TablePage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: TablePage, loader: chargerTable }
        },
        ErrorBoundary: PageErreur,
      },
      {
        path: 'plats',
        handle: { fil: [{ libelle: 'Plats' }] },
        HydrateFallback: PageChargement,
        shouldRevalidate: sansRechargementPourParametres,
        lazy: async () => {
          const [{ PlatsPage }, { chargerPlats }] = await Promise.all([
            import('@/routes/admin/PlatsPage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: PlatsPage, loader: chargerPlats }
        },
        ErrorBoundary: PageErreur,
      },
      {
        path: 'plats/:platId',
        handle: { fil: [{ libelle: 'Plats', vers: '/admin/plats' }, { libelle: 'Fiche du plat' }] },
        HydrateFallback: PageChargement,
        shouldRevalidate: sansRechargementPourParametres,
        lazy: async () => {
          const [{ PlatPage }, { chargerPlat }] = await Promise.all([
            import('@/routes/admin/PlatPage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: PlatPage, loader: chargerPlat }
        },
        ErrorBoundary: PageErreur,
      },
      {
        path: 'categories',
        handle: { fil: [{ libelle: 'Catégories' }] },
        HydrateFallback: PageChargement,
        lazy: async () => {
          const [{ CategoriesPage }, { chargerCategories }] = await Promise.all([
            import('@/routes/admin/CategoriesPage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: CategoriesPage, loader: chargerCategories }
        },
        ErrorBoundary: PageErreur,
      },
      {
        path: 'personnel',
        handle: { fil: [{ libelle: 'Personnel' }] },
        HydrateFallback: PageChargement,
        lazy: async () => {
          const [{ PersonnelPage }, { chargerPersonnel }] = await Promise.all([
            import('@/routes/admin/PersonnelPage'),
            import('@/routes/admin/admin.loader'),
          ])
          return { Component: PersonnelPage, loader: chargerPersonnel }
        },
        ErrorBoundary: PageErreur,
      },
    ],
  },
  {
    path: '*',
    Component: PageIntrouvable,
  },
])
