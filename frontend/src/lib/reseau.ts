interface InformationsReseau {
  saveData?: boolean
  effectiveType?: string
}

/**
 * Menu texte automatique (CLAUDE.md §8) : photos masquées par défaut si le client a demandé l'économie de données,
 * ou si le débit est vraiment trop faible pour les charger.
 * Network Information API, non standard (surtout Chrome Android) : si elle est absente, on affiche les photos.
 * `effectiveType` est une mesure du débit réel, pas le type de réseau : sur un réseau mobile chargé, Chrome annonce
 * « 2g » en pleine 4G (constaté sur MTN Douala le 2026-09-16). On ne masque donc plus les photos dans ce cas :
 * c'est le bouton de la carte qui laisse le client décider.
 */
export function reseauLent(): boolean {
  const connexion = (navigator as Navigator & { connection?: InformationsReseau }).connection
  return Boolean(connexion?.saveData) || connexion?.effectiveType === 'slow-2g'
}
