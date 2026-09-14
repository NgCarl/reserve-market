const nombre = new Intl.NumberFormat('fr-FR')

/** 2500 → « 2 500 FCFA ». Montants entiers, jamais de décimale (CLAUDE.md §6). */
export const formaterPrix = (montant: number): string => `${nombre.format(montant)} FCFA`
