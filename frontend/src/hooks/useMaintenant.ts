import { useEffect, useState } from 'react'

/** Heure courante, rafraîchie à intervalle régulier : fait avancer les minutes d'attente sans action de l'utilisateur. */
export function useMaintenant(intervalleMs = 30_000): number {
  const [maintenant, setMaintenant] = useState(() => Date.now())
  useEffect(() => {
    const minuteur = window.setInterval(() => setMaintenant(Date.now()), intervalleMs)
    return () => window.clearInterval(minuteur)
  }, [intervalleMs])
  return maintenant
}
