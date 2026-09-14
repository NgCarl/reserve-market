import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../lib/env.js'
import { TooManyRequestsError, UnauthorizedError } from '../lib/errors.js'
import { hacherMotDePasse, verifierMotDePasse } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import { DUREE_SESSION_MS } from '../lib/session.js'
import {
  annulerTentative,
  cleTentative,
  enregistrerEchec,
  enregistrerSucces,
  reserverTentative,
} from './tentatives.service.js'
import { selectUtilisateurPublic, type UtilisateurPublic } from './utilisateur.service.js'

// Même message pour un email inconnu, un compte désactivé ou un mauvais mot de passe :
// la réponse ne révèle pas quels comptes existent.
const MESSAGE_IDENTIFIANTS = 'Email ou mot de passe incorrect'
const MESSAGE_SESSION = 'Session invalide ou expirée'

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

/** Renvoie l'utilisateur si les identifiants sont valides et le compte actif, null sinon. */
async function verifierIdentifiants(email: string, motDePasse: string): Promise<UtilisateurPublic | null> {
  const compte = await prisma.utilisateur.findUnique({
    where: { email },
    select: { ...selectUtilisateurPublic, actif: true, motDePasseHash: true },
  })
  const motDePasseValide = await verifierMotDePasse(motDePasse, compte?.motDePasseHash ?? (await hashLeurre))
  if (!compte || !compte.actif || !motDePasseValide) return null
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

  let utilisateur: UtilisateurPublic | null
  try {
    utilisateur = await verifierIdentifiants(email, motDePasse)
  } catch (error) {
    annulerTentative(cle)
    throw error
  }

  if (!utilisateur) {
    const suspension = enregistrerEchec(cle)
    throw suspension > 0 ? erreurSuspension(suspension) : new UnauthorizedError(MESSAGE_IDENTIFIANTS)
  }
  enregistrerSucces(cle)

  const jeton = jwt.sign({}, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(utilisateur.id),
    expiresIn: DUREE_SESSION_MS / 1000,
  })
  return { utilisateur, jeton }
}

export async function utilisateurDepuisJeton(jeton: string): Promise<UtilisateurPublic> {
  let sujet: string | undefined
  try {
    // algorithms explicite : empêche un jeton forgé d'imposer un autre algorithme.
    const payload = jwt.verify(jeton, env.JWT_SECRET, { algorithms: ['HS256'] })
    sujet = typeof payload === 'string' ? undefined : payload.sub
  } catch (error) {
    // TokenExpiredError et NotBeforeError héritent de JsonWebTokenError.
    if (error instanceof jwt.JsonWebTokenError) throw new UnauthorizedError(MESSAGE_SESSION)
    throw error
  }

  const id = Number(sujet)
  if (!Number.isSafeInteger(id)) throw new UnauthorizedError(MESSAGE_SESSION)

  // Relu en base à chaque requête : désactiver un compte ou changer son rôle prend effet
  // immédiatement, sans attendre l'expiration du jeton.
  const utilisateur = await prisma.utilisateur.findFirst({
    where: { id, actif: true },
    select: selectUtilisateurPublic,
  })
  if (!utilisateur) throw new UnauthorizedError(MESSAGE_SESSION)
  return utilisateur
}
