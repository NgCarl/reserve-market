// Transcription de CARTE_MENU.pdf (carte imprimée du restaurant).
// Prix en FCFA, tels qu'imprimés. Pour les plats à plusieurs tailles, le prix de
// chaque taille est le prix complet de la carte : le seed calcule les suppléments.
//
// Écarts volontaires avec la carte imprimée :
// - la seconde rubrique « JUS » (eaux) est nommée « Eaux » ;
// - les doublons Supermont 1,5 L et Opur 1,5 L n'apparaissent qu'une fois ;
// - Château Montgueret, Cantus Terra et Blue Moon n'ont pas de prix sur la carte : absents.

export type PosteSeed = 'BAR' | 'CUISINE'

export interface TailleSeed {
  nom: string
  prix: number
}

export type PlatSeed =
  | { nom: string; description?: string; prix: number }
  | { nom: string; description?: string; tailles: readonly [TailleSeed, TailleSeed, ...TailleSeed[]] }

export interface CategorieSeed {
  nom: string
  poste: PosteSeed
  plats: readonly PlatSeed[]
}

export const restaurantSeed = {
  nom: 'Réserve Market',
  telephone: '657 54 95 70 / 640 39 39 39',
  adresse: 'Ngodi Bakoko, carrefour Ari, axe lourd Village / Yassa, Douala',
} as const

// Base indiquée par le restaurant le 2026-09-15 : 15 tables de 6 places. L'admin ajuste ensuite table par table.
export const tablesSeed = { nombre: 15, chaisesParTable: 6 } as const

// Tailles des ice creams : trois prix sur la carte, sans nom. Noms provisoires.
const glace = (petit: number, moyen: number, grand: number) =>
  [
    { nom: 'Petit', prix: petit },
    { nom: 'Moyen', prix: moyen },
    { nom: 'Grand', prix: grand },
  ] as const

export const carte: readonly CategorieSeed[] = [
  {
    nom: 'Petits déjeuners',
    poste: 'CUISINE',
    plats: [
      { nom: 'Omelette nature', prix: 1000 },
      { nom: 'Omelette mimoza', prix: 1500 },
      { nom: 'Omelette japonaise', prix: 1500 },
    ],
  },
  {
    nom: 'Entrées',
    poste: 'CUISINE',
    plats: [
      { nom: "Salade cocktail d'avocat", prix: 1500 },
      { nom: 'Salade composée', prix: 1500 },
      { nom: "Salade d'avocat", prix: 1500 },
      { nom: 'Salade fraîcheur', prix: 2000 },
      { nom: 'Salade hawaïenne', prix: 2000 },
      { nom: 'Salade mexicaine', prix: 3000 },
      { nom: 'Salade Réserve Market', prix: 4000 },
      { nom: 'Assiette de fruits', prix: 1500 },
    ],
  },
  {
    nom: 'Plats',
    poste: 'CUISINE',
    plats: [
      { nom: 'Ndolé continental', prix: 2500 },
      { nom: 'Ndolé royal', prix: 3500 },
      { nom: 'Ndolé viande', prix: 2000 },
      { nom: 'Ndoba machoiron', prix: 2500 },
      { nom: 'Pasta crevette courgette', prix: 3000 },
      { nom: "Rognon à l'ail", prix: 3000 },
      { nom: 'Rôti de bœuf jambon', prix: 4000 },
      { nom: 'Saucisse de Toulouse', prix: 3500 },
      { nom: "Soupe à l'ancienne tripe", prix: 3000 },
      { nom: 'Méli-mélo viande du Camer', prix: 6000 },
      { nom: 'Picota romana', prix: 5000 },
      { nom: 'Bœuf bourguignon', prix: 4000 },
      { nom: 'Bolognaise', prix: 3000 },
      { nom: 'Carbonara', prix: 5000 },
      { nom: 'Canibal italienne', prix: 3000 },
      { nom: 'Côte de porc', prix: 3000 },
      {
        nom: 'Poulet DG',
        tailles: [
          { nom: '1/4', prix: 6000 },
          { nom: 'Entier', prix: 12000 },
        ],
      },
      { nom: "Crevettes à l'ail", prix: 6000 },
      { nom: 'Njap-cheu', description: 'Viande ou poisson fumé', prix: 3500 },
      { nom: 'Crevettes au curry', prix: 6500 },
      { nom: 'Poulet forestière', prix: 5000 },
      { nom: "Tarjine d'agneau et couscous algérien", prix: 7000 },
      { nom: 'Dio de capitaine crevettes crème fraîche', prix: 6500 },
      { nom: 'Water fufu and eru', prix: 2000 },
    ],
  },
  {
    nom: 'Grillades',
    poste: 'CUISINE',
    plats: [
      { nom: 'Bar braisé', prix: 5000 },
      { nom: 'Brochette de bœuf', prix: 1000 },
      { nom: 'Maquereau braisé', prix: 3000 },
      { nom: 'Mouton grillé', prix: 5000 },
      {
        nom: 'Poulet grillé',
        tailles: [
          { nom: '1/4', prix: 3000 },
          { nom: '1/2', prix: 6000 },
          { nom: 'Entier', prix: 10000 },
        ],
      },
      { nom: 'Sole braisée', prix: 6000 },
      { nom: 'Steak grillé', prix: 5000 },
      { nom: 'Mixe grillé Camer', description: 'Porc, poulet, bœuf', prix: 7500 },
    ],
  },
  {
    nom: 'Fast-food & pizza',
    poste: 'CUISINE',
    plats: [
      {
        nom: 'Poulet pané',
        tailles: [
          { nom: '1/4', prix: 2500 },
          { nom: '1/2', prix: 5000 },
          { nom: 'Entier', prix: 10000 },
        ],
      },
      { nom: 'Poulet Marengo', prix: 4000 },
      { nom: 'Poulet mayo', prix: 4500 },
      { nom: 'Pizza végétarienne', prix: 3000 },
      { nom: 'Pizza margherita', prix: 3500 },
      { nom: 'Pizza canibal', prix: 3500 },
      { nom: 'Pizza 4 saisons', prix: 3500 },
      { nom: 'Pizza fruits de mer adulte', prix: 4000 },
      { nom: 'Gambas', prix: 6000 },
      { nom: 'Assiette de fruits de mer', description: 'Calamar, capitaine', prix: 7000 },
    ],
  },
  {
    nom: 'Accompagnements',
    poste: 'CUISINE',
    plats: [
      { nom: 'Miondo', prix: 1000 },
      { nom: 'Riz', prix: 1000 },
      { nom: 'Plantain', prix: 1000 },
      { nom: 'Pomme de terre', prix: 1000 },
    ],
  },
  {
    nom: 'Nos sauces',
    poste: 'CUISINE',
    plats: [
      { nom: 'Sauce verte', prix: 1000 },
      { nom: 'Sauce basquaise', prix: 1000 },
      { nom: 'Sauce provinciale', prix: 1000 },
      { nom: 'Sauce crème', prix: 1000 },
      { nom: 'Sauce forestière', prix: 1000 },
      { nom: 'Sauce Penja', prix: 1000 },
      { nom: 'Sauce poivre', prix: 1000 },
    ],
  },
  {
    nom: 'Bières',
    poste: 'BAR',
    plats: [
      { nom: 'Orijin 65 cl', prix: 1500 },
      { nom: '33 Export 65 cl', prix: 1000 },
      { nom: 'Castel 65 cl', prix: 1000 },
      { nom: 'Manyan 65 cl', prix: 1000 },
      { nom: 'Guinness 65 cl', prix: 1500 },
      { nom: 'Tonic Imperial 1 L', prix: 1000 },
      { nom: 'Beaufort light et lager 65 cl', prix: 1000 },
      { nom: 'Mutzig 65 cl', prix: 1000 },
      { nom: 'Doppel Munich 65 cl', prix: 1000 },
      { nom: 'Ice Black 30 cl', prix: 1000 },
      { nom: 'Kadji Beer 0,5 L canette', prix: 1000 },
      { nom: 'Red Bull 0,25 L', prix: 1000 },
      { nom: 'Malta 0,5 L', prix: 1000 },
      { nom: 'Heineken', prix: 1500 },
      {
        nom: 'Pression',
        tailles: [
          { nom: '0,5 L', prix: 1000 },
          { nom: '1 L', prix: 2000 },
          { nom: '3 L', prix: 3000 },
        ],
      },
      { nom: 'K44 65 cl', prix: 1000 },
    ],
  },
  {
    nom: 'Jus',
    poste: 'BAR',
    plats: [
      { nom: 'Special pamplemousse 1 L', prix: 1000 },
      { nom: 'Kadji 65 cl', prix: 1000 },
      { nom: 'Top pamplemousse 33 cl', prix: 500 },
      { nom: 'Top ananas 33 cl', prix: 500 },
      { nom: 'Sprite 33 cl', prix: 500 },
      { nom: 'Fanta 33 cl', prix: 500 },
      { nom: 'Special Red Fruit 1,5 L', prix: 1000 },
      {
        nom: 'Vimto',
        tailles: [
          { nom: '33 cl', prix: 500 },
          { nom: '1,5 L', prix: 1000 },
        ],
      },
      { nom: 'Orangina', prix: 1500 },
    ],
  },
  {
    nom: 'Eaux',
    poste: 'BAR',
    plats: [
      {
        nom: 'Madiba',
        tailles: [
          { nom: '0,5 L', prix: 500 },
          { nom: '1,5 L', prix: 1000 },
        ],
      },
      { nom: 'Supermont 1,5 L', prix: 1000 },
      { nom: 'Opur 1,5 L', prix: 1000 },
    ],
  },
  {
    nom: 'Champagne',
    poste: 'BAR',
    plats: [
      { nom: 'Ruinart Blanc de Blancs 75 cl', prix: 75000 },
      { nom: 'Veuve Clicquot Brut 75 cl', prix: 60000 },
    ],
  },
  {
    nom: 'Whisky',
    poste: 'BAR',
    plats: [
      {
        nom: 'Chivas Regal',
        tailles: [
          { nom: '12 ans', prix: 30000 },
          { nom: '18 ans', prix: 75000 },
        ],
      },
      { nom: "Jack Daniel's", prix: 25000 },
      { nom: 'Singleton of Dufftown', prix: 30000 },
    ],
  },
  {
    nom: 'Vins',
    poste: 'BAR',
    plats: [
      { nom: 'Grand vin de Bordeaux Médoc 75 cl', prix: 20000 },
      { nom: "Haut Terre de d'Exxeption Bordeaux 75 cl", prix: 15000 },
      { nom: 'Château Connétable Talbot 75 cl', prix: 50000 },
      { nom: 'Manon Côte de Provence 1 L', prix: 15000 },
      { nom: 'Carillonade 1 L', prix: 15000 },
      { nom: 'Rhum Baita Grand Cru', prix: 15000 },
      { nom: 'Charmes de Champeroux', description: 'Côte de Bergerac 75 cl', prix: 10000 },
      { nom: 'Moscato Campofero', prix: 10000 },
      { nom: 'Alliance', prix: 10000 },
      { nom: 'Haut Médoc de Giscours', prix: 25000 },
      { nom: 'Martini B 1 L', prix: 20000 },
      { nom: 'Martini R 1 L', prix: 20000 },
      { nom: 'Baileys', prix: 20000 },
      { nom: 'Campari', prix: 25000 },
    ],
  },
  {
    // Poste BAR supposé : à confirmer avec le restaurant.
    nom: 'Ice cream',
    poste: 'BAR',
    plats: [
      { nom: 'Midnight Obsession', tailles: glace(1500, 3000, 3500) },
      { nom: 'Strawberry Romance', tailles: glace(1500, 2500, 3000) },
      { nom: 'Mocha Madness', tailles: glace(1500, 3000, 3500) },
      { nom: 'Birthday Bliss', tailles: glace(1500, 3000, 3500) },
      { nom: 'Dream Galaxy', tailles: glace(1500, 3000, 3500) },
      { nom: 'Ice cream only', tailles: glace(1000, 2000, 2500) },
      { nom: 'Ice cream + 2 toppings', tailles: glace(1000, 2500, 3500) },
      { nom: 'Choco Dream Shake', prix: 2500 },
      { nom: 'Cookie Cream Shake', prix: 2500 },
      { nom: 'Caramel Coffee Shake', prix: 2500 },
    ],
  },
  {
    nom: 'Cocktails sans alcool',
    poste: 'BAR',
    plats: [
      { nom: 'Peinture au lait de coco', description: 'Lait de coco, sirop de menthe', prix: 2500 },
      {
        nom: 'Virgin mojito',
        description: 'Citron, feuille de menthe, sucre de canne, eau gazeuse',
        prix: 3500,
      },
      {
        nom: 'Mojito',
        description: "Jus de citron, jus d'ananas, sirop de fraise, sirop de kiwi, ananas",
        prix: 3000,
      },
    ],
  },
  {
    nom: 'Cocktails alcoolisés',
    poste: 'BAR',
    plats: [
      {
        nom: 'Mojito',
        description: 'Citron, sucre de canne, feuille de menthe, rhum blanc, eau pétillante',
        prix: 4000,
      },
      {
        nom: 'Sex on the beach',
        description: "Vodka, jus d'orange, jus de cranberry, sirop de pêche",
        prix: 4000,
      },
      {
        nom: 'Caipirinha',
        description: 'Citron, sucre de canne, rhum blanc, eau pétillante',
        prix: 4000,
      },
      {
        nom: 'Réserve II',
        description:
          "Rhum blanc, vodka, jus d'ananas, liqueur de coco, sirop de fraise, sirop de kiwi, banane",
        prix: 5000,
      },
      {
        nom: 'Red Meeting',
        description: 'Rhum blanc, vodka, tequila, jus de pomme, sirop de passion, sirop de framboise',
        prix: 6000,
      },
      { nom: 'Piña colada', description: "Vodka, jus d'ananas, lait de coco", prix: 4000 },
    ],
  },
]
