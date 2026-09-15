/**
 * Jetons dont le menu vient d'être mis à jour en arrière-plan (routes/client/menu.loader.ts).
 * Fichier à part, minuscule : router.ts le lit dans shouldRevalidate sans embarquer le loader du menu.
 */
export const menusRafraichis = new Set<string>()
