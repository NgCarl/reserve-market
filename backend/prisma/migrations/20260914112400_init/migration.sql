-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CUISINE', 'SERVEUR');

-- CreateEnum
CREATE TYPE "Poste" AS ENUM ('BAR', 'CUISINE');

-- CreateEnum
CREATE TYPE "StatutLigne" AS ENUM ('RECUE', 'EN_PREPARATION', 'PRETE', 'SERVIE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "SourceCommande" AS ENUM ('CLIENT', 'SERVEUR');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "TypeAppel" AS ENUM ('APPEL_SERVEUR', 'ADDITION');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombreChaises" INTEGER NOT NULL,
    "jeton" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "poste" "Poste" NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "archiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plats" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "categorieId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix" INTEGER NOT NULL,
    "imagePublicId" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER,
    "tempsPreparationMin" INTEGER,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "archiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupes_variantes" (
    "id" SERIAL NOT NULL,
    "platId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "groupes_variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options_variantes" (
    "id" SERIAL NOT NULL,
    "groupeId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "supplement" INTEGER NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "options_variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extras" (
    "id" SERIAL NOT NULL,
    "platId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plats_addons" (
    "platId" INTEGER NOT NULL,
    "platProposeId" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plats_addons_pkey" PRIMARY KEY ("platId","platProposeId")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "tableId" INTEGER NOT NULL,
    "source" "SourceCommande" NOT NULL,
    "saisieParId" INTEGER,
    "cleIdempotence" UUID NOT NULL,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "modePaiement" "ModePaiement",
    "encaisseeAt" TIMESTAMP(3),
    "encaisseeParId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_commande" (
    "id" SERIAL NOT NULL,
    "commandeId" INTEGER NOT NULL,
    "platId" INTEGER NOT NULL,
    "nomPlat" TEXT NOT NULL,
    "prixUnitaire" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "poste" "Poste" NOT NULL,
    "chaise" INTEGER,
    "note" TEXT,
    "statut" "StatutLigne" NOT NULL DEFAULT 'RECUE',
    "preparationAt" TIMESTAMP(3),
    "preteAt" TIMESTAMP(3),
    "servieAt" TIMESTAMP(3),
    "servieParId" INTEGER,
    "annuleeAt" TIMESTAMP(3),
    "annuleeParId" INTEGER,
    "motifAnnulation" TEXT,

    CONSTRAINT "lignes_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_options" (
    "id" SERIAL NOT NULL,
    "ligneId" INTEGER NOT NULL,
    "libelle" TEXT NOT NULL,
    "prix" INTEGER NOT NULL,

    CONSTRAINT "lignes_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appels_table" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "tableId" INTEGER NOT NULL,
    "type" "TypeAppel" NOT NULL,
    "modePaiement" "ModePaiement",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteAt" TIMESTAMP(3),
    "traiteParId" INTEGER,

    CONSTRAINT "appels_table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_restaurantId_idx" ON "utilisateurs"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "tables_jeton_key" ON "tables"("jeton");

-- CreateIndex
CREATE UNIQUE INDEX "tables_restaurantId_numero_key" ON "tables"("restaurantId", "numero");

-- CreateIndex
CREATE INDEX "categories_restaurantId_ordre_idx" ON "categories"("restaurantId", "ordre");

-- CreateIndex
CREATE INDEX "plats_restaurantId_categorieId_ordre_idx" ON "plats"("restaurantId", "categorieId", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "groupes_variantes_platId_nom_key" ON "groupes_variantes"("platId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "options_variantes_groupeId_nom_key" ON "options_variantes"("groupeId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "extras_platId_nom_key" ON "extras"("platId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_cleIdempotence_key" ON "commandes"("cleIdempotence");

-- CreateIndex
CREATE INDEX "commandes_restaurantId_createdAt_idx" ON "commandes"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "commandes_tableId_encaisseeAt_idx" ON "commandes"("tableId", "encaisseeAt");

-- CreateIndex
CREATE INDEX "lignes_commande_commandeId_idx" ON "lignes_commande"("commandeId");

-- CreateIndex
CREATE INDEX "lignes_commande_poste_statut_idx" ON "lignes_commande"("poste", "statut");

-- CreateIndex
CREATE INDEX "lignes_options_ligneId_idx" ON "lignes_options"("ligneId");

-- CreateIndex
CREATE INDEX "appels_table_restaurantId_traiteAt_idx" ON "appels_table"("restaurantId", "traiteAt");

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plats" ADD CONSTRAINT "plats_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plats" ADD CONSTRAINT "plats_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupes_variantes" ADD CONSTRAINT "groupes_variantes_platId_fkey" FOREIGN KEY ("platId") REFERENCES "plats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options_variantes" ADD CONSTRAINT "options_variantes_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupes_variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extras" ADD CONSTRAINT "extras_platId_fkey" FOREIGN KEY ("platId") REFERENCES "plats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plats_addons" ADD CONSTRAINT "plats_addons_platId_fkey" FOREIGN KEY ("platId") REFERENCES "plats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plats_addons" ADD CONSTRAINT "plats_addons_platProposeId_fkey" FOREIGN KEY ("platProposeId") REFERENCES "plats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_saisieParId_fkey" FOREIGN KEY ("saisieParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_encaisseeParId_fkey" FOREIGN KEY ("encaisseeParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_platId_fkey" FOREIGN KEY ("platId") REFERENCES "plats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_servieParId_fkey" FOREIGN KEY ("servieParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_annuleeParId_fkey" FOREIGN KEY ("annuleeParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_options" ADD CONSTRAINT "lignes_options_ligneId_fkey" FOREIGN KEY ("ligneId") REFERENCES "lignes_commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appels_table" ADD CONSTRAINT "appels_table_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appels_table" ADD CONSTRAINT "appels_table_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appels_table" ADD CONSTRAINT "appels_table_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Contraintes métier (CLAUDE.md §6). Prisma ne sait pas les exprimer dans le schéma :
-- elles sont ajoutées à la main. https://www.prisma.io/docs/orm/prisma-migrate/workflows/unsupported-database-features
-- Une valeur NULL satisfait un CHECK : les colonnes optionnelles restent optionnelles.

ALTER TABLE "tables" ADD CONSTRAINT "tables_numero_positif" CHECK ("numero" > 0);
ALTER TABLE "tables" ADD CONSTRAINT "tables_nombre_chaises_positif" CHECK ("nombreChaises" > 0);

ALTER TABLE "plats" ADD CONSTRAINT "plats_prix_positif" CHECK ("prix" >= 0);
ALTER TABLE "plats" ADD CONSTRAINT "plats_stock_positif" CHECK ("stock" >= 0);
ALTER TABLE "plats" ADD CONSTRAINT "plats_temps_preparation_positif" CHECK ("tempsPreparationMin" > 0);

ALTER TABLE "options_variantes" ADD CONSTRAINT "options_variantes_supplement_positif" CHECK ("supplement" >= 0);
ALTER TABLE "extras" ADD CONSTRAINT "extras_prix_positif" CHECK ("prix" >= 0);

-- Encaissée = serveur et mode de paiement connus.
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_encaissement_complet"
  CHECK ("encaisseeAt" IS NULL OR ("encaisseeParId" IS NOT NULL AND "modePaiement" IS NOT NULL));

ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_quantite_positive" CHECK ("quantite" > 0);
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_prix_unitaire_positif" CHECK ("prixUnitaire" >= 0);
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_chaise_positive" CHECK ("chaise" > 0);
-- Une annulation porte toujours un motif.
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_annulation_motivee"
  CHECK ("statut" <> 'ANNULEE' OR "motifAnnulation" IS NOT NULL);

ALTER TABLE "lignes_options" ADD CONSTRAINT "lignes_options_prix_positif" CHECK ("prix" >= 0);

-- Le mode de paiement est renseigné pour une demande d'addition, et seulement pour elle.
ALTER TABLE "appels_table" ADD CONSTRAINT "appels_table_mode_si_addition"
  CHECK (("type" = 'ADDITION') = ("modePaiement" IS NOT NULL));
