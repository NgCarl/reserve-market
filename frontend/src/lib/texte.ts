/** « Ndolé » et « ndole » se retrouvent : minuscules et accents retirés. */
export const normaliser = (texte: string): string =>
  texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr').trim()
