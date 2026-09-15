import { Prisma } from '../generated/prisma/client.js'
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors.js'
import { hacherMotDePasse } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import type { Inscription, ModificationUtilisateur, NouvelUtilisateur } from '../schemas/utilisateur.schema.js'

/** Seuls champs d'un utilisateur qui sortent des services : jamais motDePasseHash. */
export const selectUtilisateurPublic = {
  id: true,
  restaurantId: true,
  nom: true,
  email: true,
  role: true,
} as const satisfies Prisma.UtilisateurSelect

export type UtilisateurPublic = Prisma.UtilisateurGetPayload<{ select: typeof selectUtilisateurPublic }>

/** Vue du back-office : le statut et la date d'inscription en plus. */
const selectPersonnel = { ...selectUtilisateurPublic, actif: true, createdAt: true } as const satisfies Prisma.UtilisateurSelect

const estDoublonEmail = (error: unknown): boolean =>
  // P2002 : contrainte d'unicité, ici sur l'email.
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

export async function creerUtilisateur(restaurantId: number, donnees: NouvelUtilisateur): Promise<UtilisateurPublic> {
  const motDePasseHash = await hacherMotDePasse(donnees.motDePasse)
  try {
    return await prisma.utilisateur.create({
      data: { restaurantId, nom: donnees.nom, email: donnees.email, role: donnees.role, motDePasseHash },
      select: selectUtilisateurPublic,
    })
  } catch (error) {
    if (estDoublonEmail(error)) throw new ConflictError('Un compte existe déjà avec cet email')
    throw error
  }
}

/**
 * Inscription d'un membre du personnel : le compte est créé inactif, sans aucun accès tant qu'un admin ne l'a pas activé.
 * Email déjà utilisé : rien n'est créé et la réponse est la même, pour ne pas révéler quels emails ont un compte.
 */
export async function demanderAcces(donnees: Inscription): Promise<void> {
  // Un seul restaurant en v1 : restaurantId est présent partout, le multi-tenant n'est pas construit (§4).
  const restaurant = await prisma.restaurant.findFirst({ orderBy: { id: 'asc' }, select: { id: true } })
  if (!restaurant) throw new NotFoundError('Restaurant introuvable')
  // Haché avant l'insertion, même si l'email existe : le temps de réponse ne trahit rien non plus.
  const motDePasseHash = await hacherMotDePasse(donnees.motDePasse)
  try {
    await prisma.utilisateur.create({
      data: { restaurantId: restaurant.id, nom: donnees.nom, email: donnees.email, role: donnees.role, motDePasseHash, actif: false },
      select: { id: true },
    })
  } catch (error) {
    if (estDoublonEmail(error)) return
    throw error
  }
}

export function listerUtilisateurs(restaurantId: number) {
  return prisma.utilisateur.findMany({
    where: { restaurantId },
    select: selectPersonnel,
    orderBy: { nom: 'asc' },
  })
}

/** Activation, désactivation ou changement de rôle par un admin. Effet immédiat : le compte est relu à chaque requête. */
export async function modifierUtilisateur(
  restaurantId: number,
  adminId: number,
  utilisateurId: number,
  donnees: ModificationUtilisateur,
) {
  // Un admin ne se désactive pas et ne se retire pas son rôle : le restaurant pourrait se retrouver sans administrateur.
  if (utilisateurId === adminId) throw new ValidationError('Vous ne pouvez pas modifier votre propre compte.')
  const { count } = await prisma.utilisateur.updateMany({
    where: { id: utilisateurId, restaurantId },
    data: donnees,
  })
  if (count === 0) throw new NotFoundError('Compte introuvable')
  return prisma.utilisateur.findUniqueOrThrow({ where: { id: utilisateurId }, select: selectPersonnel })
}
