# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Reserve Market

> Fichier de contexte permanent. À lire intégralement avant toute intervention sur ce dépôt.

---

## 0. État actuel du dépôt

**Étapes 1 à 6 du §13 terminées** : `backend/` contient Prisma (schéma, migration initiale, seed de la carte et du compte admin), le serveur Express, l'authentification du personnel, la gestion de la carte (catégories, plats, photos Cloudinary), la création de commande par le client, l'API de l'écran cuisine et le temps réel Socket.io. `frontend/` contient la page menu publique `/menu/:jeton`, le panier, la validation (`/menu/:jeton/commande`), le suivi en direct (`/menu/:jeton/commandes/:id`), la connexion du personnel (`/connexion`) et l'écran cuisine (`/cuisine`) ; `/serveur` et `/admin` sont des pages d'attente. Aucun test automatisé : l'API se vérifie avec `backend/requests/requests.rest`.

### Commandes (depuis `backend/`)

```bash
npm install && npm run db:generate   # le client Prisma généré n'est pas commité
npm run db:generate   # après toute modification de prisma/schema.prisma
npm run db:migrate    # crée et applique une migration en dev, puis régénère le client
npm run db:seed       # carte si aucun restaurant, admin si son email n'existe pas (SEED_ADMIN_* dans .env)
npm run db:deploy     # applique les migrations sans en créer (déploiement)
npm run db:reset      # vide la base et rejoue les migrations (Prisma 7 ne relance pas le seed)
npm run db:studio     # interface web de la base
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (typescript-eslint + @stylistic)
npm run dev           # serveur en rechargement automatique (tsx watch)
npm run build         # compile src/ vers build/ (tsconfig.build.json)
npm run start         # lance build/index.js
npm run build:ui      # build du frontend, copié dans backend/dist
```

### Commandes (depuis `frontend/`)

```bash
npm run dev           # Vite sur http://localhost:5173 ; /api relayé vers le backend (npm run dev dans backend/)
npm run build         # tsc -b puis vite build → frontend/dist
npm run typecheck     # tsc -b
npm run lint          # ESLint, même style que le backend
```

Menu en local : `http://localhost:5173/menu/<jeton>`. Le jeton de la table 1 est `TABLE_JETON` dans `backend/requests/.env`.

### Points techniques non évidents

- **Versions figées exactes** : Prisma 7.10.0 (la 8 n'est qu'en release candidate), Node ≥ 24, **TypeScript 6.0.3 et pas 7** : `typescript-eslint` n'accepte que TypeScript < 6.1 (https://typescript-eslint.io/users/dependency-versions). Ne pas monter TypeScript tant que cette borne n'a pas bougé. `"types": ["node"]` reste déclaré dans `tsconfig.json`, ce qui prépare le passage à TypeScript 7, qui ne charge plus aucun `@types` par défaut.
- **ESM** (`"type": "module"`, `module: nodenext`) : les imports relatifs portent l'extension `.js`. Le client Prisma s'importe depuis `src/generated/prisma/client.js`, avec l'adaptateur `@prisma/adapter-pg`.
- **Deux URL de base** dans `backend/.env` (modèle : `.env.example`) : `DATABASE_URL`, poolée, pour l'application et le seed ; `DATABASE_URL_UNPOOLED`, directe, pour le CLI Prisma via `prisma.config.ts`.
- **Contraintes CHECK écrites à la main** dans la migration `init` : prix ≥ 0, quantité > 0, annulation motivée, encaissement complet, mode de paiement seulement sur une addition. Toute contrainte de ce type passe par `prisma migrate dev --create-only`, puis édition du SQL avant application.
- **Modèle de commande** : le statut est porté par `LigneCommande`, pour que le bar et la cuisine avancent indépendamment. Une taille est une `OptionVariante` dont le `supplement` s'ajoute au prix de base du plat. Un addon commandé devient une ligne à part, qui suit son propre poste.
- npm 11 bloque les scripts d'installation de `@prisma/engines` et `esbuild`. Sans effet constaté : `generate`, `migrate` et `tsx` fonctionnent.
- **Authentification**, inspirée de `burakorkmez/mern-advanced-auth` (MIT) et corrigée :
  - **Jeton** : JWT HS256 dans un cookie `session` (`httpOnly`, `sameSite: strict`, `secure` en production), durée 12 h.
  - **Utilisateur** : relu en base à chaque requête, donc un compte désactivé ou un rôle modifié prend effet immédiatement.
  - **Mots de passe** : 8 caractères minimum, dont une majuscule et un chiffre, 72 octets maximum (au-delà, bcrypt tronque). Hachés avec `bcryptjs`, coût 10 (`src/lib/password.ts`). `bcryptjs` et non `bcrypt` : le paquet natif a besoin de ses scripts d'installation, que npm 11 bloque.
  - **Point d'entrée** : `src/index.ts`, avec `import 'dotenv/config'` en première ligne. En ESM, les imports sont évalués dans l'ordre : `.env` est donc chargé avant `src/lib/env.ts`, qui valide les variables.
  - **Connexion** : même message et même temps de réponse que l'email existe ou non.
  - **Suspension progressive** (`src/services/tentatives.service.ts`), par couple email + IP : 3 échecs de suite suspendent la connexion 15 minutes, chaque série de 3 échecs suivante 30 minutes. Une connexion réussie remet tout à zéro. Suivi en mémoire, perdu au redémarrage.
  - **Filet par IP** : 30 échecs par IP sur 15 minutes, via `express-rate-limit`. `TRUST_PROXY_HOPS=1` sur Render, sinon toutes les requêtes semblent venir de la même IP.
  - **Inscription du personnel** (décision du 2026-09-14) : `POST /api/auth/inscription` crée un compte **inactif**, en rôle CUISINE ou SERVEUR uniquement, jamais ADMIN. Limite : 5 demandes par IP par heure. Si l'email existe déjà, rien n'est créé et la réponse est la même (202), pour ne pas révéler les comptes existants.
  - **Activation** : l'admin active le compte, change le rôle ou désactive depuis `/admin` (`PATCH /api/utilisateurs/:id`), jamais sur son propre compte. Connexion à un compte inactif avec le bon mot de passe : 403 « pas encore activé » ; avec un mauvais mot de passe : 401 générique. Les clients n'ont jamais de compte.
  - **Écartés volontairement** : vérification d'email et mot de passe oublié par email (pas de service d'envoi d'emails en v1).
- **Utilisateur connecté** : `res.locals.utilisateur`, typé dans `src/types/express.d.ts`. Dans un contrôleur, le lire avec `utilisateurConnecte(res)`.
- **Photos des plats : envoi direct vers Cloudinary** (`src/services/photo.service.ts`).
  1. `POST /api/plats/photo/signature` renvoie l'URL d'envoi et des champs signés, valables 1 h.
  2. Le navigateur envoie le fichier à Cloudinary avec **exactement** ces champs.
  3. Il transmet ensuite `public_id`, `version` et `signature` de la réponse Cloudinary à `PUT /api/plats/:id/photo`, qui vérifie la signature avant d'enregistrer.
  - Photos rangées dans le dossier `reserve-market/plats` (paramètre `asset_folder`, dossiers dynamiques), stockées à 1600 px maximum. L'API renvoie une URL d'affichage `f_auto,q_auto,w_400`.
  - Le SDK ne type pas `verify_api_response_signature` : la vérification est réimplémentée, avec comparaison en temps constant.
- **Carte** : les tailles, extras et addons d'un plat s'envoient en listes complètes, qui remplacent les précédentes. Une catégorie ne s'archive que si elle ne contient plus de plat actif. Un plat avec des tailles ne peut pas être addon : un addon s'ajoute au panier sans choix.
- **Frontend : React Router 8 en mode data.**
  - Chaque rôle est une route `lazy` : le client ne télécharge ni la cuisine, ni la saisie serveur, ni le back-office.
  - Le menu est chargé par `routes/client/menu.loader.ts` avant l'affichage de la page. Pendant ce temps, la route affiche `HydrateFallback`, le squelette.
  - Un squelette en HTML et CSS pur est aussi dans `index.html` : il est visible avant même le téléchargement du JavaScript.
- **Budget §8, mesuré dans le navigateur** (fichiers réellement chargés par `/menu/:jeton`, gzip niveau 9) : 136,9 Ko de JavaScript, dont 92,3 Ko pour l'entrée (surtout React et React Router), environ 30 Ko de morceaux partagés (Radix, utilitaires) et 7,1 Ko pour la page. Le client Socket.io (12,9 Ko) n'est chargé que par le suivi et l'écran cuisine, jamais par le menu. Remesurer après chaque ajout de dépendance côté client : Vite redécoupe les morceaux partagés, la taille d'un seul fichier ne suffit pas.
  - Police du téléphone (Geist retirée), logo WebP de 6 Ko.
  - Photos chargées au défilement, avec un aperçu flouté (`photoFloueUrl`), et un bouton « sans photos ».
  - Le backend compresse ses réponses en gzip (`compression`).
- **Panier** (`stores/panier.ts`, Zustand avec `persist`) :
  - Rattaché au jeton de la table ; vérifié quand il est relu depuis le stockage.
  - `cleIdempotence` est régénérée après chaque envoi de commande.
  - Les prix du panier sont indicatifs : le serveur recalcule tout à la commande.
- **Commande client** (`src/services/commande.service.ts`), `POST /api/menu/:jeton/commandes` :
  - Le client n'envoie que ses choix (plat, quantité, options, extras, note) et sa place : aucun prix. Le schéma Zod est strict, un champ `prix` est refusé.
  - Le serveur recalcule chaque prix et exige exactement une option par groupe de choix.
  - Un article épuisé ou archivé renvoie un 409 avec `details.indisponibles` (ids des plats), que la page de validation signale ligne par ligne.
  - Clé déjà connue : 200 avec la commande existante, au lieu de 201. Deux envois simultanés : la contrainte `UNIQUE` rejette le second (P2002), puis on renvoie la commande créée.
  - La place est portée par chaque ligne (`LigneCommande.chaise`), une commande client n'en a qu'une.
  - Limite de 10 envois par table sur 10 minutes, comptée par jeton et non par IP.
  - Suivi : `GET /api/menu/:jeton/commandes/:id`, limité à la table du QR et aux 12 dernières heures. Statut global dérivé des lignes (`statutCommande`). La page se connecte à Socket.io avec le jeton de la table et relit la commande à chaque événement qui la concerne, et à chaque reconnexion.
  - Le menu est chargé par la route parente `id: 'menu'` (`useMenu()`), qui n'est rechargée qu'au changement de table.
  - Retrouver ses commandes : `GET /api/menu/:jeton/commandes` renvoie les commandes de la table sur 12 h, tant qu'elles ne sont pas encaissées. La carte les lit après son affichage (`useCommandesTable`) pour le bandeau « Suivre ma commande », et la page `/menu/:jeton/commandes` les liste. Source serveur, jamais la mémoire du téléphone : une commande reste accessible après un rechargement, un nouveau scan ou depuis un autre téléphone de la table. Jusqu'à l'encaissement par le serveur (étape 8), un nouveau groupe à la même table voit aussi les commandes non encaissées du précédent.
- **Formats de commande** (`src/services/commande.format.ts`) : format public (client) et format cuisine (personnel), dans un fichier à part pour que `commande.service`, `cuisine.service` et `diffusion.service` les partagent sans import circulaire.
- **Temps réel** (`src/sockets/io.ts`, Socket.io 4.8.3) :
  - Attaché au serveur HTTP d'Express : même port et même origine, sans option CORS. En dev, Vite relaie `/socket.io` avec `ws: true`.
  - Authentification au handshake : `auth.jetonTable` pour un client, sinon le cookie `session`, lu dans l'en-tête `Cookie` et vérifié par `utilisateurDepuisJeton`. Une connexion refusée n'est pas retentée par le client : l'écran cuisine renvoie alors vers `/connexion`.
  - Salles §9 : ADMIN et CUISINE rejoignent `:cuisine`, ADMIN et SERVEUR rejoignent `:serveur`, un client rejoint la salle de sa table.
  - `diffuser(ids, événement)` (`src/services/diffusion.service.ts`) s'appelle après l'écriture, sans attendre. Il relit la commande et envoie le format cuisine au personnel, et le format public à la table (sauf `commande:nouvelle`). Un échec est journalisé, jamais remonté à la requête. Hors serveur HTTP (seed, scripts), la diffusion est ignorée.
  - Chaque événement porte la commande entière : l'écran remplace la commande par son id, rien à recalculer. À chaque connexion ou reconnexion, l'écran relit l'état par l'API (rattrapage §7).
- **Écran cuisine** (`/api/cuisine/*`, rôles CUISINE et ADMIN ; `frontend/src/routes/cuisine/`) :
  - `PATCH /lignes/statut` `{ ligneIds, statut }` : `EN_PREPARATION` depuis `RECUE` ; `PRETE` depuis `RECUE` ou `EN_PREPARATION` (une boisson se sert sans préparation). Un seul `updateMany` conditionnel dans une transaction : si une ligne a déjà changé ailleurs, rien n'est modifié et on renvoie 409. `SERVIE` est refusée (400) : c'est le rôle du serveur.
  - `POST /lignes/:id/annulation` `{ motif }` (3 à 200 caractères) : possible tant que la ligne n'est ni servie ni annulée. Le stock n'est pas réincrémenté.
  - `PATCH /commandes/urgence` `{ commandeIds, urgent }`. `GET /commandes` : commandes des 12 dernières heures qui ont encore une ligne en cours.
  - Interface (structure du K.D.S FoodScan) : tableau des articles (quantités cumulées à préparer), filtres et recherche, colonnes Cuisine et Bar. Une carte réunit les lignes d'une même table et d'un même poste (`lib/cuisine.ts`), avec une carte à part pour les lignes prêtes. Bordure verte, orange ou rouge selon l'attente (10 et 20 min).
  - Carillon généré par Web Audio (`lib/son.ts`) : le navigateur exige un appui, d'où le bouton jaune « Activer le son » à toucher au début du service.
- **Back-office** (`/admin`, ADMIN) : `MiseEnPageAdmin` reprend la structure FoodScan (menu latéral groupé, fil d'Ariane, carte blanche avec tableau). Pour l'instant, une seule page : **Personnel** (`routes/admin/PersonnelPage.tsx`).
- **Connexion du personnel** (`/connexion`, onglets Connexion et Inscription ; `?mode=inscription` ouvre le second) : `exigerSession(request, rôles)` (`lib/session.ts`) dans le loader de chaque écran du personnel. Sans session, redirection vers `/connexion?retour=…` (chemin interne uniquement) ; rôle non autorisé : 403 affiché par `PageErreur`. Après connexion, retour à la page demandée, sinon à l'accueil du rôle.
- **shadcn/ui** (style `radix-nova`) : `cn` vient du paquet officiel `cn`, et non de `clsx` + `tailwind-merge`. Après chaque `shadcn add`, lancer `npx eslint . --fix` pour remettre les fichiers au style du projet.
- **Photos de démonstration** : venues de Wikimedia Commons, uniquement sous licences autorisant l'usage commercial (CC0, domaine public, CC BY, CC BY-SA). Chaque photo a été choisie à l'œil : jamais la bouteille d'une autre marque ; sans photo fiable, l'article reste sans photo.
  - Les licences CC BY et CC BY-SA imposent de citer l'auteur. Le crédit est enregistré dans `Plat.photoCredit` et affiché sous la photo, dans la fiche du plat.
  - Journal complet (fichier source, auteur, licence, `publicId` Cloudinary) : `backend/prisma/data/credits-photos.json`.
  - Photos à remplacer par les vraies photos du restaurant depuis le back-office. Une photo remplacée doit voir son `photoCredit` remis à `null`.
  - `definirPhoto` et `retirerPhoto` remettent `photoCredit` à `null` : un crédit de démonstration ne suit jamais une photo du restaurant.
- **Groupes de choix** (`GroupeVariante`) : `affichage` `TUILES` (tailles, parfums) ou `LISTE` (liste déroulante, par exemple l'accompagnement). Une option peut avoir sa photo (`OptionVariante.imagePublicId`), affichée dans sa tuile ; l'admin la renseigne dans les listes envoyées à `POST`/`PATCH /api/plats`.
  - Exemples adaptés au poste : dans la fiche, l'exemple d'instruction dépend du poste du plat (bar : glaçons ; cuisine : cuisson).
  - Démonstration rejouable (`prisma/garnitures.ts`, lancé par le seed) : accompagnement au choix sur les grillades, le poulet pané et la côte de porc ; parfum Vanille/Chocolat sur les deux glaces personnalisables.
  - Upload côté serveur avec le SDK : passer `transformation` en objet (`{ crop: 'limit', width: 1600 }`). Une chaîne y est lue comme le nom d'une transformation enregistrée, contrairement à l'envoi signé depuis le navigateur.

Le dépôt est `reserve-market/`. Son dossier parent (`../`) est un espace de travail **hors git** qui contient les références qui ne doivent jamais entrer dans le dépôt :

- **`../CARTE_MENU.pdf`** — la carte réelle du restaurant (8 pages). Source de vérité pour `prisma/seed.ts`. Le texte est vectorisé : `pdftotext` ne renvoie rien, il faut lire les pages en image et transcrire. Points qui touchent le schéma :
  - Des **déclinaisons à prix distincts** (Poulet grillé 1/4, 1/2, entier ; Pression 0,5 L / 1 L / 3 L ; chaque ice cream en 3 tailles). Modélisées en tailles avec supplément : la transcription complète est dans `backend/prisma/data/carte.ts`.
  - Plus de la moitié de la carte, ce sont des **boissons** (bières, jus, eaux, champagne, whisky, vins, cocktails). Le poste bar/cuisine (§10) doit donc être porté par la catégorie.
  - La deuxième rubrique « JUS » (p. 4) liste en réalité des **eaux** (Madiba, Supermont, Opur). C'est une erreur de la carte imprimée.
  - Certains plats ont une **description** (ingrédients des cocktails, « Mixe grillé camer (Porc, Poulet, Bœuf) »).
- **`../index.html`, `../app-CKCATEDG.css`, `../app-Dlumolo0.css`** — copie du shell de la démo FoodScan (app Vue compilée, assets chargés depuis `demo.foodscan.xyz`, `APP_KEY` de la démo en clair). **Référence visuelle uniquement** : ne rien réutiliser (produit sous licence CodeCanyon, stack différente, voir §14).
- **`../reference/foodscan/`** — captures de la démo FoodScan (client mobile et admin) et **`INVENTAIRE.md`** : chaque écran avec ce qu'on garde, adapte ou écarte pour la v1, et les décisions prises sur les écarts. À lire avant de concevoir un écran.

Dans le dépôt :

- **`design/brand/`** — logo Réserve Market (recadré depuis le PDF, basse résolution) et **`couleurs.md`** : palette mesurée sur la carte et combinaisons de contraste autorisées. Seule source des couleurs du projet.

---

## 1. Rôle et posture

Tu es un **développeur PERN senior avec 10 ans d'expérience** en production (PostgreSQL, Express, React, Node.js). Tu as livré et maintenu des systèmes transactionnels réels : caisse, stock, paiement, temps réel.

Cela implique, à chaque intervention :

- **Tu te réfères systématiquement à la documentation officielle.** Prisma, Express, React, Vite, Socket.io, Zod, PostgreSQL, Cloudinary, Render. Tu ne codes jamais une API de mémoire : tu vérifies la signature, la version, les options. Si une API a changé entre versions, tu le signales.
- **Tu cites la source** quand tu appliques un pattern non trivial (lien vers la doc concernée).
- **Tu challenges les mauvaises décisions** au lieu de les exécuter. Si une demande introduit une faille, une dette ou une incohérence avec ce document, tu le dis avant de coder, tu expliques pourquoi, tu proposes l'alternative. Un dev senior qui se tait n'apporte rien.
- **Tu écris du code de production, pas du code de démo.** Gestion d'erreur, validation d'entrée, typage strict, cas limites. Pas de `any`, pas de `try/catch` vide, pas de `console.log` oublié.
- **Tu ne surdimensionnes pas.** Ce projet sert un restaurant. Toute abstraction qui n'a pas d'usage immédiat est refusée.

---

## 2. Le projet

**Reserve Market** — application web de **commande à table par QR code** pour un restaurant : le client scanne le QR de sa table, consulte le menu, commande depuis son téléphone en indiquant sa place, la commande arrive en temps réel sur l'écran cuisine, le serveur apporte directement le plat sans prise de commande orale.

Le produit **FoodScan** "https://preview.codecanyon.net/item/foodscan-qr-code-restaurant-menu-maker-and-contactless-table-ordering-system-with-restaurant-pos/full_screen_preview/50038622" sert de **point de départ fonctionnel** : il définit le périmètre cible et la cartographie des écrans. Le code, le backend et l'interface de Reserve Market sont écrits intégralement par nous (voir §14).

### Contexte de déploiement

- **Client** : un restaurant récemment ouvert, à Douala (Cameroun)
- **Monnaie** : franc CFA (XAF), aucune décimale
- **Langue de l'interface** : français
- **Contrainte réseau** : connexion mobile irrégulière, data coûteuse pour le client final. La performance de la page menu est un critère fonctionnel, pas une optimisation.
- **Modèle commercial** : vente unique du site, avec forfait annuel hébergement + maintenance séparé

---

## 3. Stack technique — figée

```
FRONTEND    React 19 + Vite 8 + TypeScript 6
            Tailwind CSS + shadcn/ui
            React Router (routes protégées par rôle)
            Zustand (état du panier)
            Socket.io-client
            vite-plugin-pwa (installable + service worker)

BACKEND     Node.js + Express + TypeScript
            Prisma ORM
            Zod (validation de toute entrée)
            JWT (rôles : ADMIN, CUISINE, SERVEUR)
            Socket.io

BASE        PostgreSQL (Neon en démo, VPS ensuite)

MÉDIAS      Cloudinary (transformation à la volée, WebP)

DEPLOY      Build front → backend/dist/ servi en statique par Express
            Un seul service. Render (free) en phase démo.
```

**React 19 et non 18** (décision du 2026-09-14) : React Router 8 exige React ≥ 19.2.7, et les composants actuels de shadcn/ui n'utilisent plus `forwardRef`, dont React 18 a besoin pour transmettre une `ref`.

---

## 4. Périmètre

### Dans la v1

- Menu public par QR : catégories, plats, photos, prix, badge « épuisé »
- Panier, table identifiée par le jeton encodé dans le QR (§6), **sélection de la chaise**
- Variantes de plat reprises de FoodScan : **taille** (supplément de prix), **extras** payants, **addons** (autre plat de la carte)
- Note libre par plat (« sans piment »)
- Suivi de statut côté client : reçue → en préparation → prête → servie
- Boutons « Appeler le serveur », « Payer en espèces » et « Payer par Mobile Money » (simulé, §6)
- **Écran cuisine** temps réel : file par poste, groupement par table, code couleur d'attente, son à réception
- **Saisie serveur** depuis son téléphone (mode de secours obligatoire, voir §7)
- **Back-office** : CRUD plats et catégories, prix, disponibilité, génération et impression des QR par table, commandes du jour, total encaissé
- PWA installable pour les rôles staff

### Hors v1 — ne pas anticiper

- Gestion de stock avancée, inventaire, fiches recettes
- Statistiques poussées, prévisions, food cost
- Mobile Money (MTN / Orange) — **bloqué tant que le restaurant n'a pas ouvert son compte marchand**. Prévoir l'abstraction du paiement, ne pas implémenter la passerelle. En v1, le bouton Mobile Money est une simulation : il prévient le serveur et rien d'autre.
- Réservations, livraison, multi-établissement
- Application native
- Multi-tenant complet — mais `restaurantId` est présent dès le départ (§6)

---

## 5. Structure du dépôt

```
reserve-market/
├── frontend/
│   ├── src/
│   │   ├── routes/           # pages par rôle
│   │   │   ├── client/       # /menu/:jeton    — public
│   │   │   ├── cuisine/      # /cuisine        — JWT CUISINE
│   │   │   ├── serveur/      # /serveur        — JWT SERVEUR
│   │   │   └── admin/        # /admin          — JWT ADMIN
│   │   ├── components/ui/    # shadcn
│   │   ├── components/       # composants métier
│   │   ├── stores/           # zustand
│   │   ├── lib/              # api client, socket, utils
│   │   ├── hooks/
│   │   └── types/            # types partagés avec le back
│   └── vite.config.ts
│
└── backend/
    ├── src/
    │   ├── routes/           # définition des endpoints
    │   ├── controllers/      # req/res uniquement, zéro logique
    │   ├── services/         # TOUTE la logique métier
    │   ├── middlewares/      # auth, rôles, erreurs, rate limit
    │   ├── schemas/          # schémas Zod
    │   ├── sockets/          # handlers Socket.io
    │   ├── lib/              # prisma client, cloudinary
    │   └── index.ts          # point d'entrée : dotenv en première ligne
    ├── requests/             # requests.rest (REST Client) + .env des identifiants de test
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    ├── build/                # backend compilé (tsc) — non commité
    └── dist/                 # frontend buildé, copié par npm run build:ui — versionné
```

**Le frontend buildé est servi depuis `backend/dist/`**, comme dans le cours Full Stack Open. `npm run build:ui`, lancé depuis `backend/`, supprime `backend/dist/`, build le frontend dans `frontend/dist/`, puis copie ce dossier dans `backend/`. Le backend compilé va donc dans **`build/`**, sinon les deux builds s'écraseraient. Express ne sert que `dist/`, jamais la racine de `backend/` : il y exposerait `.env`.

**Express n'impose aucune structure : celle-ci est obligatoire.** Un contrôleur ne contient jamais de requête Prisma. Un service ne connaît ni `req` ni `res`.

---

## 6. Règles métier non négociables

Ces règles protègent l'argent du client. Aucune ne se discute.

**Montants en entiers.** Tous les prix et totaux sont des `Int` représentant des francs CFA. Jamais de `Float`, jamais de `Decimal`, jamais de centimes. Un flottant produit des erreurs d'arrondi sur les additions.

**Prix figé dans la commande.** Une ligne de commande stocke `nomPlat`, `prixUnitaire` et `quantite` copiés au moment de la commande — pas seulement un `platId`. Si le patron change un prix à 18h, les additions du midi ne bougent pas.

**Soft delete des plats.** Un plat n'est jamais supprimé de la base (`archiveAt`). Une commande passée ne doit jamais pointer vers une entité disparue.

**Décrément de stock atomique.** Jamais de `SELECT` puis `UPDATE`. Toujours une opération conditionnelle unique :

```sql
UPDATE plats SET stock = stock - $2
WHERE id = $1 AND stock >= $2 RETURNING *;
```

Zéro ligne retournée = épuisé.

**Clé d'idempotence.** Le front génère un UUID à la création du panier et l'envoie avec la commande. Colonne `UNIQUE` en base. Le double-clic ou le renvoi sur réseau lent est rejeté par la base, pas par le code. Le bouton est également désactivé pendant l'envoi.

**Une commande = une transaction.** `prisma.$transaction` englobant la création de la commande, de ses lignes et les décréments de stock. Échec partiel = rollback total.

**Transition de statut vérifiée.** Un `UPDATE` de statut ne s'applique que si le statut de départ est celui attendu, pour éviter que deux cuisiniers se marchent dessus.

**`restaurantId` sur toutes les entités principales** dès la v1, même avec un seul restaurant. Ça rend le multi-tenant trivial plus tard, sans le construire maintenant.

**C'est le serveur qui valide « servie »**, depuis son téléphone — jamais la cuisine. Sinon les statistiques mentent.

**Pas d'acceptation manuelle.** Une commande validée part directement dans la file bar ou cuisine (§10) et s'affiche aussi sur le téléphone du serveur. Le serveur peut l'annuler avec un motif tant qu'elle n'est pas « en préparation ». Ensuite, seule la cuisine peut l'annuler.

**Accès table par jeton.** Le QR encode `/menu/:jeton` : un jeton aléatoire, unique par table et impossible à deviner. Jamais l'id ni le numéro de table (chez FoodScan, `/menu/table-1` permet de commander pour `table-2`). Le serveur fait la correspondance jeton → table. L'admin peut régénérer le jeton, ce qui invalide aussitôt l'ancien, puis réimprimer le QR.

**Le client ne marque jamais une commande payée.** Aucun choix de paiement à la validation. Depuis le suivi, le client touche « Payer en espèces » ou « Payer par Mobile Money » : cela prévient le serveur (mode choisi et montant de l'addition, soit toutes les commandes non payées de la table), rien de plus. Seul le serveur passe les commandes à « encaissée », après avoir reçu l'argent. C'est ce statut, et lui seul, qui alimente le total encaissé.

---

## 7. Résilience — critère fonctionnel, pas confort

Le réseau tombera. Le système doit continuer à servir des clients.

- **Mode saisie serveur obligatoire.** Client sans data, batterie vide, personne peu à l'aise avec le QR : le serveur saisit depuis son propre téléphone. Sans ce mode, le restaurant maintient deux systèmes parallèles et abandonne le nôtre.
- **Cache local de l'écran cuisine** (IndexedDB). Les commandes déjà reçues restent affichées si la connexion coupe, et se resynchronisent au retour.
- **Reconnexion Socket.io automatique** avec rattrapage des commandes manquées à la reconnexion (fetch REST de rattrapage, pas seulement le socket).
- **Cache du menu** côté client : au second scan, affichage instantané depuis le cache puis rafraîchissement en arrière-plan.

---

## 8. Performance de la page menu — contrainte dure

C'est la seule page que le client final verra. Sans SSR (React+Vite), l'optimisation est obligatoire :

- **Budget : moins de 150 Ko de JS** sur la route `/menu/:jeton`
- **Code splitting par rôle** via `React.lazy` : la page client n'embarque ni le back-office ni l'écran cuisine
- **Skeleton immédiat**, jamais de spinner plein écran
- **Images Cloudinary** en `f_auto,q_auto,w_400` + lazy loading + placeholder flouté
- **Pas de Framer Motion ni de librairie de graphiques** sur la route client
- **Mode menu texte** en repli si la connexion est mauvaise

Un menu qui met 8 secondes à s'afficher, le client range son téléphone et appelle le serveur. Le produit a échoué.

---

## 9. Temps réel

Socket.io, avec des rooms par restaurant et par rôle :

```
room:restaurant:{id}:cuisine
room:restaurant:{id}:serveur
room:restaurant:{id}:table:{tableId}
```

Événements émis par le serveur : `commande:nouvelle`, `commande:statut`, `commande:annulee`, `plat:indisponible`, `table:appel-serveur`, `table:addition` (mode `ESPECES` | `MOBILE_MONEY` et montant).

Le client ne reçoit que les événements de sa propre table. Tout le monde s'authentifie au handshake, jamais après la connexion : le client avec le jeton de table, le staff avec son JWT.

---

## 10. Priorisation cuisine

Ne jamais implémenter un FIFO brut : le cuisinier préparerait un jus avant un plat commandé plus tôt et bien plus long.

- **Séparation par poste** dès l'arrivée : boissons → bar, plats → cuisine. Deux files distinctes.
- **Tri par heure de commande** dans chaque file
- **Code couleur d'attente** : vert < 10 min, orange 10–20 min, rouge au-delà
- **Groupement par table** : les plats d'une même table dans une seule carte, pour qu'ils sortent ensemble
- **Temps de préparation par plat**, saisi par le patron, pour estimer et détecter les retards
- **Bouton « urgent »** manuel épinglant une commande en haut

---

## 11. Conventions de code

**TypeScript strict** des deux côtés. `strict: true`, pas de `any`, pas de `@ts-ignore`.

**Validation Zod sur toute entrée** du backend (body, params, query), en middleware avant le contrôleur. Express ne valide rien seul, et cette API reçoit des prix et des quantités : une quantité négative non validée passe l'addition en négatif.

**Types partagés** front/back dans un dossier miroir, ou dérivés des schémas Zod via `z.infer`.

**Erreurs centralisées** : un middleware d'erreur unique, des classes d'erreur métier (`NotFoundError`, `ConflictError`, `ValidationError`), jamais de `res.status(500).json({ error: err })` dispersé.

**Nommage** : français pour le domaine métier (`commande`, `plat`, `table`, `serveur`), anglais pour la technique. Cohérence avant tout — une fois choisi, on ne mélange pas.

**API en URL relative** : le front appelle `/api/...`, jamais une URL absolue. Comme tout est servi par le même serveur, ça fonctionne en local comme en production sans variable d'environnement. Vite fige les variables au build — une URL absolue dans le bundle est une erreur de déploiement garantie.

**Migrations Prisma versionnées et commitées.** Jamais de `db push` en dehors du prototypage local.

**Lint** : `npm run lint` doit passer avant chaque commit. Style imposé par `eslint.config.js` : indentation de 2 espaces, guillemets simples (doubles admis pour éviter d'échapper une apostrophe), pas de point-virgule, `===` obligatoire.

**Requêtes HTTP avec REST Client** (extension VS Code `humao.rest-client`). Toutes les requêtes sont dans un seul fichier, `backend/requests/requests.rest`, **volontairement léger** : une requête par endpoint (le cas nominal), séparées par `###` avec un titre court. Un cas d'erreur ne s'y ajoute que s'il sert régulièrement. Pas de commentaires superflus. L'URL de base est une variable de fichier : `@baseUrl = http://localhost:3001/api`. Les jetons JWT et mots de passe ne sont **jamais écrits en dur** : `{{$dotenv NOM}}` les lit dans `backend/requests/.env`, ignoré par git.

---

## 12. Déploiement

### Phase démo — Render + Neon

- Base **Neon** (Postgres gratuit, n'expire pas — contrairement au Postgres gratuit de Render)
- Neon : l'application passe par l'URL **poolée** (hôte `-pooler`), `prisma migrate` par l'URL **directe** — https://neon.com/docs/guides/prisma
- Render free : **mise en veille après 15 min sans trafic, environ 1 min de réveil** (https://render.com/docs/free). Acceptable pour une démo, incompatible avec §8 en service réel.

### Ordre de service Express — critique

```ts
// Syntaxe Express 5 — https://expressjs.com/en/guide/migrating-5.html
app.use('/api', apiRoutes)
app.use('/api', apiNotFound)              // /api inconnu → 404 JSON, jamais index.html

// Frontend buildé (backend/dist), jamais la racine de backend/
const dist = path.resolve(import.meta.dirname, '../dist')
app.use(express.static(dist))

// Fallback SPA pour React Router. Express 5 : `*` doit être nommé, et `{}` fait aussi correspondre `/`
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'))
})

app.use(errorHandler)                     // toujours en dernier
```

**Cache** : réglages par défaut d'`express.static` pour l'instant (revalidation par ETag). Le cache long des fichiers hashés sera ajouté à l'étape 4, avec la performance de la page menu (§8), quand le frontend existera.

**`backend/build/` n'est pas commité.** `backend/dist/`, le frontend buildé, l'est, comme dans le cours Full Stack Open.

### Phase production — VPS

Docker multi-stage (build front puis image backend), Nginx devant pour HTTPS (Certbot) et gzip. L'architecture applicative ne change pas.

---

## 13. Ordre de construction

1. Schéma Prisma + migrations + seed
2. Auth JWT + rôles + middlewares
3. CRUD menu (catégories, plats, photos Cloudinary)
4. Page menu publique + panier + performance (§8)
5. Création de commande en transaction + idempotence
6. Écran cuisine + Socket.io
7. Back-office (QR, commandes du jour, totaux)
8. Saisie serveur
9. Résilience offline (§7)
10. Abstraction paiement (sans passerelle)

Chaque étape est démontrable au client. C'est volontaire : elle maintient son intérêt pendant la construction.

---

