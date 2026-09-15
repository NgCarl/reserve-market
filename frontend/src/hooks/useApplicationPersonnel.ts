import { useEffect, useSyncExternalStore } from 'react'

let miseAJour: (() => void) | null = null
let demarre = false
const abonnes = new Set<() => void>()

function lierManifest() {
  if (document.querySelector('link[rel="manifest"]')) return
  const lien = document.createElement('link')
  lien.rel = 'manifest'
  lien.href = '/manifest.webmanifest'
  document.head.append(lien)
}

function enregistrerServiceWorker() {
  if (demarre || !('serviceWorker' in navigator)) return
  demarre = true
  // https://vite-pwa-org.netlify.app/guide/prompt-for-update.html
  import('virtual:pwa-register').then(({ registerSW }) => {
    const activer = registerSW({
      immediate: true,
      onNeedRefresh: () => {
        miseAJour = () => void activer(true)
        abonnes.forEach((prevenir) => prevenir())
      },
      onRegisterError: (probleme: unknown) => console.error('Service worker non enregistré', probleme),
    })
  }, (probleme: unknown) => console.error(probleme))
}

const abonner = (prevenir: () => void) => {
  abonnes.add(prevenir)
  return () => {
    abonnes.delete(prevenir)
  }
}
const lireMiseAJour = () => miseAJour

/**
 * Application installable du personnel (§3, §7) : lie le manifest et enregistre le service worker, qui garde le code
 * des écrans pour les rouvrir sans réseau. Appelé par EnteteStaff, donc jamais sur le téléphone d'un client (§8).
 * Renvoie la fonction qui applique une nouvelle version déployée, ou null s'il n'y en a pas.
 */
export function useApplicationPersonnel(): (() => void) | null {
  useEffect(() => {
    lierManifest()
    enregistrerServiceWorker()
  }, [])
  return useSyncExternalStore(abonner, lireMiseAJour)
}
