import { networkInterfaces } from 'node:os'

const HOTE_LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])(:\d+)?$/

/** Première adresse IPv4 de l'ordinateur sur le réseau local (Wi-Fi, Ethernet), null s'il n'est pas connecté. */
function ipReseauLocal(): string | null {
  for (const interfaces of Object.values(networkInterfaces())) {
    for (const reseau of interfaces ?? []) {
      if (reseau.family === 'IPv4' && !reseau.internal) return reseau.address
    }
  }
  return null
}

/**
 * En développement, un QR généré depuis http://localhost pointerait vers le téléphone lui-même : il ne s'ouvrirait pas.
 * On remplace localhost par l'adresse de l'ordinateur sur le réseau local, que le téléphone peut joindre sur le même Wi-Fi.
 */
export function hotePourTelephone(hote: string): string {
  const correspondance = HOTE_LOCAL.exec(hote)
  if (!correspondance) return hote
  const ip = ipReseauLocal()
  return ip ? `${ip}${correspondance[2] ?? ''}` : hote
}
