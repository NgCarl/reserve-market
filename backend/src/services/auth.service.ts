import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { Role } from '../generated/prisma/client.js'
import { env } from '../lib/env.js'
import { ForbiddenError, TooManyRequestsError, UnauthorizedError } from '../lib/errors.js'
import { hacherMotDePasse, verifierMotDePasse } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import { DUREE_INACTIVITE_ADMIN_MS, DUREE_SESSION_MS, RENOUVELLEMENT_SESSION_MS } from '../lib/session.js'
import {
  annulerTentative,
  cleTentative,
  enregistrerEchec,
  enregistrerSucces,
  reserverTentative,
} from './tentatives.service.js'
import { selectUtilisateurPublic, type UtilisateurPublic } from './utilisateur.service.js'

// Même message pour un email inconnu ou un mauvais mot de passe : la réponse ne révèle pas quels comptes existent.
const MESSAGE_IDENTIFIANTS = 'Email ou mot de passe incorrect'
const MESSAGE_INACTIF = "Compte pas encore activé : l'administrateur du restaurant doit valider votre accès."
const MESSAGE_SESSION = 'Session invalide ou expirée'
const MESSAGE_INACTIVITE = "Session fermée après 30 minutes d'inactivité. Reconnectez-vous."

// Vérifié à la place du vrai hash quand l'email est inconnu : la réponse prend le même temps
// que pour un compte existant, et le chronométrage ne trahit rien non plus.
const hashLeurre = hacherMotDePasse(randomBytes(32).toString('base64url'))

function erreurSuspension(attenteMs: number): TooManyRequestsError {
  const minutes = Math.ceil(attenteMs / 60_000)
  return new TooManyRequestsError(
    `Trop de tentatives échouées. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    Math.ceil(attenteMs / 1000),
  )
}

/**
 * Validité d'un jeton. L'admin, souvent sur un poste partagé, est déconnecté après 30 minutes sans activité
 * (le jeton est renouvelé à chaque requête). La cuisine et les serveurs tiennent un service entier.
 */
const dureeJetonMs = (role: Role): number => (role === 'ADMIN' ? DUREE_INACTIVITE_ADMIN_MS : DUREE_SESSION_MS)

function signerJeton(utilisateur: Pick<UtilisateurPublic, 'id' | 'role'>): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(utilisateur.id),
    expiresIn: dureeJetonMs(utilisateur.role) / 1000,
  })
}

/** L'utilisateur si les identifiants sont valides, « inactif » si le compte attend son activation, null sinon. */
async function verifierIdentifiants(email: string, motDePasse: string): Promise<UtilisateurPublic | 'inactif' | null> {
  const compte = await prisma.utilisateur.findUnique({
    where: { email },
    select: { ...selectUtilisateurPublic, actif: true, motDePasseHash: true },
  })
  const motDePasseValide = await verifierMotDePasse(motDePasse, compte?.motDePasseHash ?? (await hashLeurre))
  if (!compte || !motDePasseValide) return null
  // Dit seulement à qui connaît le bon mot de passe : impossible de découvrir ainsi quels comptes existent.
  if (!compte.actif) return 'inactif'
  return { id: compte.id, restaurantId: compte.restaurantId, nom: compte.nom, email: compte.email, role: compte.role }
}

export async function connecter(
  email: string,
  motDePasse: string,
  ip: string,
): Promise<{ utilisateur: UtilisateurPublic; jeton: string }> {
  const cle = cleTentative(email, ip)
  const attente = reserverTentative(cle)
  if (attente > 0) throw erreurSuspension(attente)

  let utilisateur: UtilisateurPublic | 'inactif' | null
  try {
    utilisateur = await verifierIdentifiants(email, motDePasse)
  } catch (error) {
    annulerTentative(cle)
    throw error
  }

  if (utilisateur === 'inactif') {
    // Bon mot de passe : ce n'est pas un échec, la tentative ne compte pas pour la suspension.
    annulerTentative(cle)
    throw new ForbiddenError(MESSAGE_INACTIF)
  }
  if (!utilisateur) {
    const suspension = enregistrerEchec(cle)
    throw suspension > 0 ? erreurSuspension(suspension) : new UnauthorizedError(MESSAGE_IDENTIFIANTS)
  }
  enregistrerSucces(cle)

  return { utilisateur, jeton: signerJeton(utilisateur) }
}

/**
 * Session portée par le cookie. Pour un admin, renvoie aussi un jeton renouvelé : la fenêtre d'inactivité
 * de 30 minutes repart à chaque requête (au plus une fois par minute, pour ne pas signer à chaque appel).
 */
export async function sessionDepuisJeton(jeton: string): Promise<{ utilisateur: UtilisateurPublic; jetonRenouvele: string | null }> {
  let sujet: string | undefined
  let emisLe: number | undefined
  try {
    // algorithms explicite : empêche un jeton forgé d'imposer un autre algorithme.
    const payload = jwt.verify(jeton, env.JWT_SECRET, { algorithms: ['HS256'] })
    if (typeof payload !== 'string') {
      sujet = payload.sub
      emisLe = payload.iat
    }
  } catch (error) {
    // TokenExpiredError et NotBeforeError héritent de JsonWebTokenError.
    if (error instanceof jwt.JsonWebTokenError) throw new UnauthorizedError(MESSAGE_SESSION)
    throw error
  }

  const id = Number(sujet)
  if (!Number.isSafeInteger(id) || emisLe === undefined) throw new UnauthorizedError(MESSAGE_SESSION)

  // Relu en base à chaque requête : désactiver un compte ou changer son rôle prend effet
  // immédiatement, sans attendre l'expiration du jeton.
  const utilisateur = await prisma.utilisateur.findFirst({
    where: { id, actif: true },
    select: selectUtilisateurPublic,
  })
  if (!utilisateur) throw new UnauthorizedError(MESSAGE_SESSION)
  if (utilisateur.role !== 'ADMIN') return { utilisateur, jetonRenouvele: null }

  // Âge lu sur iat et non sur exp : un compte passé ADMIN pendant sa session est aussitôt soumis à la règle.
  const age = Date.now() - emisLe * 1000
  if (age > DUREE_INACTIVITE_ADMIN_MS) throw new UnauthorizedError(MESSAGE_INACTIVITE)
  return { utilisateur, jetonRenouvele: age > RENOUVELLEMENT_SESSION_MS ? signerJeton(utilisateur) : null }
}

/** Handshake Socket.io : mêmes vérifications, sans renouvellement (pas de réponse HTTP pour poser le cookie). */
export async function utilisateurDepuisJeton(jeton: string): Promise<UtilisateurPublic> {
  return (await sessionDepuisJeton(jeton)).utilisateur
}
