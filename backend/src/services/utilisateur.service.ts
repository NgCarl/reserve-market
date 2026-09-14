import { Prisma } from '../generated/prisma/client.js'
import { ConflictError } from '../lib/errors.js'
import { hacherMotDePasse } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import type { NouvelUtilisateur } from '../schemas/utilisateur.schema.js'

/** Seuls champs d'un utilisateur qui sortent des services : jamais motDePasseHash. */
export const selectUtilisateurPublic = {
  id: true,
  restaurantId: true,
  nom: true,
  email: true,
  role: true,
} as const satisfies Prisma.UtilisateurSelect

export type UtilisateurPublic = Prisma.UtilisateurGetPayload<{ select: typeof selectUtilisateurPublic }>

export async function creerUtilisateur(restaurantId: number, donnees: NouvelUtilisateur): Promise<UtilisateurPublic> {
  const motDePasseHash = await hacherMotDePasse(donnees.motDePasse)
  try {
    return await prisma.utilisateur.create({
      data: { restaurantId, nom: donnees.nom, email: donnees.email, role: donnees.role, motDePasseHash },
      select: selectUtilisateurPublic,
    })
  } catch (error) {
    // P2002 : contrainte d'unicité, ici sur l'email.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Un compte existe déjà avec cet email')
    }
    throw error
  }
}

export function listerUtilisateurs(restaurantId: number) {
  return prisma.utilisateur.findMany({
    where: { restaurantId },
    select: { ...selectUtilisateurPublic, actif: true, createdAt: true },
    orderBy: { nom: 'asc' },
  })
}
