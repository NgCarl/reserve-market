import { useEffect, useState } from 'react'
import { requeteApi } from '@/lib/api'
import type { CommandeSuivie } from '@/types/commande'

/**
 * Commandes de la table en cours de service, lues sur le serveur (et non dans la mémoire du téléphone).
 * Chargées après l'affichage du menu pour ne pas le ralentir, puis relues quand le client revient sur l'onglet.
 * null tant que la réponse n'est pas arrivée.
 */
export function useCommandesTable(jeton: string): CommandeSuivie[] | null {
  const [commandes, setCommandes] = useState<CommandeSuivie[] | null>(null)

  useEffect(() => {
    let actif = true
    const charger = () => {
      requeteApi<{ commandes: CommandeSuivie[] }>(`/menu/${encodeURIComponent(jeton)}/commandes`).then(
        (reponse) => {
          if (actif) setCommandes(reponse.commandes)
        },
        // Le bandeau est un raccourci : en cas d'échec, le menu reste utilisable sans lui.
        (probleme: unknown) => console.error(probleme),
      )
    }
    charger()
    const auRetour = () => {
      if (document.visibilityState === 'visible') charger()
    }
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      actif = false
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [jeton])

  return commandes
}
