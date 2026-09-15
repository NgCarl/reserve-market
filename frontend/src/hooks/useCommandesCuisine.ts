import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { io, type Socket } from 'socket.io-client'
import { useMemoireEcran } from '@/hooks/useMemoireEcran'
import { ErreurApi, requeteApi } from '@/lib/api'
import { fusionnerCommandes } from '@/lib/cuisine'
import type { EcranPersonnel } from '@/lib/ecranPersonnel'
import type { CommandeCuisine } from '@/types/cuisine'
import type { EvenementsPersonnel } from '@/types/temps-reel'

/**
 * Commandes de l'écran cuisine, tenues à jour en temps réel.
 * À chaque connexion, y compris après une coupure, la liste est relue par l'API : un événement a pu être manqué (§7).
 * Chaque version reçue est enregistrée sur l'appareil : sans réseau, l'écran rouvre avec les dernières commandes.
 */
export function useCommandesCuisine(ecran: EcranPersonnel<CommandeCuisine[]>, surNouvelleCommande: () => void) {
  const navigate = useNavigate()
  const [commandes, setCommandes] = useState(ecran.donnees)
  const [connecte, setConnecte] = useState(false)
  const [coupure, setCoupure] = useState(ecran.horsLigne)
  const [erreur, setErreur] = useState<string | null>(null)
  const { recuLe, recu } = useMemoireEcran('cuisine', ecran, commandes)
  // Dernière version du rappel, sans recréer la connexion à chaque rendu.
  const rappelNouvelle = useRef(surNouvelleCommande)
  useEffect(() => {
    rappelNouvelle.current = surNouvelleCommande
  })

  const versConnexion = useCallback(() => {
    void navigate(`/connexion?retour=${encodeURIComponent('/cuisine')}`, { replace: true })
  }, [navigate])

  const appliquer = useCallback((misesAJour: CommandeCuisine[]) => {
    recu()
    setCommandes((liste) => fusionnerCommandes(liste, misesAJour))
  }, [recu])

  const rattraper = useCallback(async () => {
    try {
      const reponse = await requeteApi<{ commandes: CommandeCuisine[] }>('/cuisine/commandes')
      recu()
      setCommandes(reponse.commandes)
    } catch (probleme) {
      if (probleme instanceof ErreurApi && probleme.status === 401) versConnexion()
      else setErreur(probleme instanceof ErreurApi ? probleme.message : 'Actualisation impossible. Vérifiez la connexion.')
    }
  }, [recu, versConnexion])

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
      setCoupure(false)
      void rattraper()
    })
    socket.on('disconnect', () => {
      setConnecte(false)
      setCoupure(true)
    })
    socket.on('connect_error', () => {
      setConnecte(false)
      // Refus du serveur (session expirée) : pas de nouvelle tentative automatique, on retourne à la connexion.
      if (!socket.active) versConnexion()
      else setCoupure(true)
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

  return { commandes, connecte, coupure, recuLe, erreur, setErreur, appliquer, gererErreur }
}
