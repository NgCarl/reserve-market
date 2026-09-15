import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ErreurApi, requeteApi } from '@/lib/api'
import { deconnecter } from '@/lib/session'

/** Miroir de DUREE_INACTIVITE_ADMIN_MS (backend/src/lib/session.ts). */
const DELAI_INACTIVITE_MS = 30 * 60 * 1000
/** Sans requête pendant ce délai, un appui prolonge la session côté serveur. */
const PROLONGATION_MS = 5 * 60 * 1000
/** Activité partagée entre onglets : un onglet oublié ne déconnecte pas celui où l'admin travaille. */
const CLE_ACTIVITE = 'reserve-market-activite-admin'
const EVENEMENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

/**
 * Poste partagé : après 30 minutes sans clic ni frappe dans aucun onglet, l'admin est déconnecté
 * et l'écran revient à la connexion, pour ne pas laisser le back-office affiché.
 */
export function useDeconnexionInactivite(actif: boolean): void {
  const navigate = useNavigate()

  useEffect(() => {
    if (!actif) return
    let activiteLocale = Date.now()
    let dernierPartage = 0
    let derniereProlongation = Date.now()
    let termine = false

    const derniereActivite = (): number => {
      try {
        return Math.max(activiteLocale, Number(localStorage.getItem(CLE_ACTIVITE)) || 0)
      } catch {
        // Stockage indisponible (navigation privée stricte) : on se fie à l'activité de cet onglet.
        return activiteLocale
      }
    }

    const expirer = () => {
      if (termine) return
      termine = true
      const retour = encodeURIComponent(window.location.pathname + window.location.search)
      void deconnecter().then(() => navigate(`/connexion?expiree=1&retour=${retour}`, { replace: true }))
    }

    const surActivite = () => {
      const maintenant = Date.now()
      activiteLocale = maintenant
      if (maintenant - dernierPartage > 15_000) {
        dernierPartage = maintenant
        try {
          localStorage.setItem(CLE_ACTIVITE, String(maintenant))
        } catch (erreur) {
          console.warn('Activité non partagée entre les onglets', erreur)
        }
      }
      // L'admin lit ou remplit un formulaire sans appeler l'API : on prolonge la session serveur.
      if (maintenant - derniereProlongation > PROLONGATION_MS) {
        derniereProlongation = maintenant
        requeteApi('/auth/check-auth').catch((probleme: unknown) => {
          if (probleme instanceof ErreurApi && probleme.status === 401) expirer()
          else console.error(probleme)
        })
      }
    }

    const verifier = () => {
      if (Date.now() - derniereActivite() >= DELAI_INACTIVITE_MS) expirer()
    }

    surActivite()
    for (const evenement of EVENEMENTS) window.addEventListener(evenement, surActivite, { passive: true })
    const minuteur = window.setInterval(verifier, 15_000)
    // Retour sur l'onglet après une mise en veille : le minuteur a pu être suspendu.
    document.addEventListener('visibilitychange', verifier)
    return () => {
      for (const evenement of EVENEMENTS) window.removeEventListener(evenement, surActivite)
      window.clearInterval(minuteur)
      document.removeEventListener('visibilitychange', verifier)
    }
  }, [actif, navigate])
}
