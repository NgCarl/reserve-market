interface InformationsReseau {
  saveData?: boolean
  effectiveType?: string
}

/**
 * Menu texte automatique (CLAUDE.md §8) : photos masquées si le téléphone est en économiseur de données
 * ou en 2G. Network Information API, non standard (surtout Chrome Android) : si elle est absente, on affiche les photos.
 */
export function reseauLent(): boolean {
  const connexion = (navigator as Navigator & { connection?: InformationsReseau }).connection
  return Boolean(connexion?.saveData) || connexion?.effectiveType === '2g' || connexion?.effectiveType === 'slow-2g'
}
