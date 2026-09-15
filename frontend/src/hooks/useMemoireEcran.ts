import { useCallback, useEffect, useRef, useState } from 'react'
import { ecrireCache, type ClePersonnel } from '@/lib/cacheLocal'
import type { EcranEnregistre, EcranPersonnel } from '@/lib/ecranPersonnel'

/**
 * Enregistre sur l'appareil chaque nouvelle version reçue du serveur (§7), pour la réafficher après une coupure.
 * Appeler recu() juste avant d'appliquer des données venues du réseau : les données reprises du cache ne sont
 * jamais réenregistrées, sinon elles paraîtraient plus récentes qu'elles ne le sont.
 */
export function useMemoireEcran<T>(cle: ClePersonnel, ecran: EcranPersonnel<T>, donnees: T) {
  const [recuLe, setRecuLe] = useState(ecran.recuLe)
  const aEnregistrer = useRef(false)

  useEffect(() => {
    if (!aEnregistrer.current) return
    aEnregistrer.current = false
    void ecrireCache<EcranEnregistre<T>>(cle, { utilisateur: ecran.utilisateur, donnees })
  }, [cle, donnees, ecran.utilisateur])

  const recu = useCallback(() => {
    aEnregistrer.current = true
    setRecuLe(Date.now())
  }, [])

  return { recuLe, recu }
}
