import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { io, type Socket } from 'socket.io-client'
import { ErreurApi, requeteApi } from '@/lib/api'
import { fusionnerCommandes } from '@/lib/cuisine'
import type { CommandeCuisine } from '@/types/cuisine'
import type { EvenementsPersonnel } from '@/types/temps-reel'

/**
 * Commandes de l'écran cuisine, tenues à jour en temps réel.
 * À chaque connexion, y compris après une coupure, la liste est relue par l'API : un événement a pu être manqué (§7).
 */
export function useCommandesCuisine(initiales: CommandeCuisine[], surNouvelleCommande: () => void) {
  const navigate = useNavigate()
  const [commandes, setCommandes] = useState(initiales)
  const [connecte, setConnecte] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Dernière version du rappel, sans recréer la connexion à chaque rendu.
  const rappelNouvelle = useRef(surNouvelleCommande)
  useEffect(() => {
    rappelNouvelle.current = surNouvelleCommande
  })

  const versConnexion = useCallback(() => {
    void navigate(`/connexion?retour=${encodeURIComponent('/cuisine')}`, { replace: true })
  }, [navigate])

  const appliquer = useCallback((misesAJour: CommandeCuisine[]) => {
    setCommandes((liste) => fusionnerCommandes(liste, misesAJour))
  }, [])

  const rattraper = useCallback(async () => {
    try {
      const reponse = await requeteApi<{ commandes: CommandeCuisine[] }>('/cuisine/commandes')
      setCommandes(reponse.commandes)
    } catch (probleme) {
      if (probleme instanceof ErreurApi && probleme.status === 401) versConnexion()
      else setErreur(probleme instanceof ErreurApi ? probleme.message : 'Actualisation impossible. Vérifiez la connexion.')
    }
  }, [versConnexion])

  const gererErreur = useCallback((probleme: unknown) => {
    if (probleme instanceof ErreurApi && probleme.status === 401) {
      versConnexion()
      return
    }
    setErreur(probleme instanceof ErreurApi ? probleme.message : 'Action impossible. Vérifiez la connexion puis réessayez.')
    // 409 : un autre écran est passé avant ; on recharge l'état réel.
    if (probleme instanceof ErreurApi && probleme.status === 409) void rattraper()
  }, [rattraper, versConnexion])

  useEffect(() => {
    // Même origine : le cookie de session part avec la connexion, le serveur authentifie au handshake (§9).
    const socket: Socket<EvenementsPersonnel> = io()
    socket.on('connect', () => {
      setConnecte(true)
      void rattraper()
    })
    socket.on('disconnect', () => setConnecte(false))
    socket.on('connect_error', () => {
      setConnecte(false)
      // Refus du serveur (session expirée) : pas de nouvelle tentative automatique, on retourne à la connexion.
      if (!socket.active) versConnexion()
    })
    socket.on('commande:nouvelle', (commande) => {
      appliquer([commande])
      rappelNouvelle.current()
    })
    socket.on('commande:statut', (commande) => appliquer([commande]))
    socket.on('commande:annulee', (commande) => appliquer([commande]))
    return () => {
      socket.disconnect()
    }
  }, [appliquer, rattraper, versConnexion])

  return { commandes, connecte, erreur, setErreur, appliquer, gererErreur }
}
