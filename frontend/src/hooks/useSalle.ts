import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { io, type Socket } from 'socket.io-client'
import { useMemoireEcran } from '@/hooks/useMemoireEcran'
import { ErreurApi, messageErreur, requeteApi } from '@/lib/api'
import type { EcranPersonnel } from '@/lib/ecranPersonnel'
import type { EtatSalle } from '@/types/salle'
import type { EvenementsSalle } from '@/types/temps-reel'

const compterAServir = (etat: EtatSalle): number => etat.tables.reduce((total, table) => total + table.aServir.length, 0)

/**
 * État de la salle sur le téléphone du serveur, tenu à jour en temps réel.
 * Chaque événement (commande, statut, appel) relit l'état par l'API : une seule source de vérité, et le rattrapage
 * après une coupure est automatique (§7). Chaque version reçue est enregistrée sur l'appareil pour rouvrir sans réseau.
 */
export function useSalle(ecran: EcranPersonnel<EtatSalle>, surAlerte: () => void) {
  const navigate = useNavigate()
  const [salle, setSalle] = useState(ecran.donnees)
  const [connecte, setConnecte] = useState(false)
  const [coupure, setCoupure] = useState(ecran.horsLigne)
  const { recuLe, recu } = useMemoireEcran('salle', ecran, salle)
  const [erreur, setErreur] = useState<string | null>(null)
  const rappelAlerte = useRef(surAlerte)
  useEffect(() => {
    rappelAlerte.current = surAlerte
  })
  const aServirConnus = useRef(compterAServir(ecran.donnees))

  const versConnexion = useCallback(() => {
    void navigate(`/connexion?retour=${encodeURIComponent('/serveur')}`, { replace: true })
  }, [navigate])

  const recharger = useCallback(async () => {
    try {
      const etat = await requeteApi<EtatSalle>('/serveur/salle')
      const aServir = compterAServir(etat)
      // Carillon quand un plat vient d'être prêt : le serveur n'a pas à surveiller son écran.
      if (aServir > aServirConnus.current) rappelAlerte.current()
      aServirConnus.current = aServir
      recu()
      setSalle(etat)
    } catch (probleme) {
      if (probleme instanceof ErreurApi && probleme.status === 401) versConnexion()
      else setErreur(messageErreur(probleme, 'Actualisation impossible. Vérifiez la connexion.'))
    }
  }, [recu, versConnexion])

  useEffect(() => {
    const socket: Socket<EvenementsSalle> = io()
    let minuteur: number | undefined
    // Une action (encaisser une table, servir plusieurs plats) produit plusieurs événements : une seule relecture.
    const planifier = () => {
      window.clearTimeout(minuteur)
      minuteur = window.setTimeout(() => void recharger(), 300)
    }
    const nouvelAppel = () => {
      rappelAlerte.current()
      planifier()
    }
    socket.on('connect', () => {
      setConnecte(true)
      setCoupure(false)
      void recharger()
    })
    socket.on('disconnect', () => {
      setConnecte(false)
      setCoupure(true)
    })
    socket.on('connect_error', () => {
      setConnecte(false)
      // Refus du serveur (session expirée) : pas de nouvelle tentative, retour à la connexion.
      if (!socket.active) versConnexion()
      else setCoupure(true)
    })
    socket.on('commande:nouvelle', planifier)
    socket.on('commande:statut', planifier)
    socket.on('commande:annulee', planifier)
    socket.on('table:appel-serveur', nouvelAppel)
    socket.on('table:addition', nouvelAppel)
    socket.on('appel:traite', planifier)
    return () => {
      window.clearTimeout(minuteur)
      socket.disconnect()
    }
  }, [recharger, versConnexion])

  return { salle, connecte, coupure, recuLe, erreur, setErreur, recharger }
}
