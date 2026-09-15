/** Champ de saisie des formulaires du personnel (maquette FoodScan : bordure fine, hauteur 48 px). */
export const classeChamp =
  'h-12 w-full rounded-lg border border-border bg-white px-3.5 text-base text-marque-nuit outline-none transition-shadow focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15'

/** Mêmes règles que le serveur (backend/src/schemas/utilisateur.schema.ts), affichées pendant la saisie. */
export const REGLES_MOT_DE_PASSE: { libelle: string; respectee: (motDePasse: string) => boolean }[] = [
  { libelle: '8 caractères minimum', respectee: (motDePasse) => motDePasse.length >= 8 },
  { libelle: 'Une majuscule', respectee: (motDePasse) => /\p{Lu}/u.test(motDePasse) },
  { libelle: 'Un chiffre', respectee: (motDePasse) => /[0-9]/.test(motDePasse) },
]
