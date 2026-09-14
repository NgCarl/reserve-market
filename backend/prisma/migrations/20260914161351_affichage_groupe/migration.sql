-- CreateEnum
CREATE TYPE "AffichageGroupe" AS ENUM ('TUILES', 'LISTE');

-- AlterTable
ALTER TABLE "groupes_variantes" ADD COLUMN     "affichage" "AffichageGroupe" NOT NULL DEFAULT 'TUILES';
