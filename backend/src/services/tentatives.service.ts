// Suspension progressive des connexions :
// 3 échecs de suite → 15 minutes, puis chaque nouvelle série de 3 échecs → 30 minutes.
//
// Clé = email + IP. Un employé qui se trompe ne bloque pas ses collègues connectés derrière la même
// box, et un inconnu ne peut pas suspendre le compte de l'admin depuis chez lui.
// Suivi en mémoire : suffisant pour une seule instance, remis à zéro au redémarrage.

const ECHECS_AVANT_SUSPENSION = 3
const PREMIERE_SUSPENSION_MS = 15 * 60_000
const SUSPENSION_SUIVANTE_MS = 30 * 60_000
// Sans nouvel échec pendant 24 h, l'historique est oublié : la suspension suivante repart à 15 minutes.
const OUBLI_MS = 24 * 60 * 60_000

interface Suivi {
  echecs: number
  enCours: number
  suspensions: number
  suspenduJusqua: number
  dernierEchec: number
}

const suivis = new Map<string, Suivi>()

export const cleTentative = (email: string, ip: string): string => `${email}|${ip}`

function obtenir(cle: string, maintenant: number): Suivi {
  const suivi = suivis.get(cle)
  const oublie = suivi && suivi.enCours === 0 && suivi.suspenduJusqua <= maintenant && maintenant - suivi.dernierEchec > OUBLI_MS
  if (suivi && !oublie) return suivi
  const nouveau = { echecs: 0, enCours: 0, suspensions: 0, suspenduJusqua: 0, dernierEchec: maintenant }
  suivis.set(cle, nouveau)
  return nouveau
}

/**
 * À appeler avant de vérifier le mot de passe. Renvoie le temps d'attente en ms, 0 si la tentative est
 * autorisée. La tentative est réservée : des requêtes envoyées en parallèle ne dépassent pas la limite.
 */
export function reserverTentative(cle: string, maintenant = Date.now()): number {
  const suivi = obtenir(cle, maintenant)
  if (suivi.suspenduJusqua > maintenant) return suivi.suspenduJusqua - maintenant
  if (suivi.echecs + suivi.enCours >= ECHECS_AVANT_SUSPENSION) return 1000
  suivi.enCours += 1
  return 0
}

/** Tentative interrompue par une erreur technique : elle ne compte pas comme un échec. */
export function annulerTentative(cle: string): void {
  const suivi = suivis.get(cle)
  if (suivi) suivi.enCours = Math.max(0, suivi.enCours - 1)
}

/** Renvoie la durée de suspension déclenchée par cet échec en ms, 0 sinon. */
export function enregistrerEchec(cle: string, maintenant = Date.now()): number {
  const suivi = obtenir(cle, maintenant)
  suivi.enCours = Math.max(0, suivi.enCours - 1)
  suivi.echecs += 1
  suivi.dernierEchec = maintenant
  if (suivi.echecs < ECHECS_AVANT_SUSPENSION) return 0

  const duree = suivi.suspensions === 0 ? PREMIERE_SUSPENSION_MS : SUSPENSION_SUIVANTE_MS
  suivi.suspensions += 1
  suivi.echecs = 0
  suivi.suspenduJusqua = maintenant + duree
  return duree
}

export function enregistrerSucces(cle: string): void {
  suivis.delete(cle)
}

// Nettoyage horaire des suivis oubliés. unref : ce minuteur n'empêche pas le processus de s'arrêter.
setInterval(() => {
  const maintenant = Date.now()
  for (const [cle, suivi] of suivis) {
    if (suivi.enCours === 0 && suivi.suspenduJusqua <= maintenant && maintenant - suivi.dernierEchec > OUBLI_MS) {
      suivis.delete(cle)
    }
  }
}, 60 * 60_000).unref()
