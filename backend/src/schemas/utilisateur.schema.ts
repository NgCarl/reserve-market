import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Role } from '../generated/prisma/client.js'
import { auMoinsUnChamp } from './commun.schema.js'

export const emailSchema = z
  .string({ error: 'Email requis' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Email invalide' }))

const nomSchema = z.string({ error: 'Nom requis' }).trim().min(1, { error: 'Nom requis' }).max(100, { error: 'Nom : 100 caractères maximum' })

const motDePasseSchema = z
  .string({ error: 'Mot de passe requis' })
  .min(8, { error: 'Au moins 8 caractères' })
  .max(128, { error: '128 caractères maximum' })
  .regex(/\p{Lu}/u, { error: 'Au moins une majuscule' })
  .regex(/[0-9]/, { error: 'Au moins un chiffre' })
  // bcrypt ignore tout ce qui dépasse 72 octets (un caractère accentué en compte 2) : on refuse plutôt que tronquer.
  .refine((motDePasse) => !bcrypt.truncates(motDePasse), { error: 'Mot de passe trop long (72 octets maximum)' })

export const nouvelUtilisateurSchema = z.strictObject({
  nom: nomSchema,
  email: emailSchema,
  motDePasse: motDePasseSchema,
  role: z.enum(Role, { error: 'Rôle attendu : ADMIN, CUISINE ou SERVEUR' }),
})

export type NouvelUtilisateur = z.infer<typeof nouvelUtilisateurSchema>

/** Inscription publique du personnel : jamais le rôle ADMIN, et le compte reste inactif jusqu'à son activation par un admin. */
export const inscriptionSchema = z.strictObject({
  nom: nomSchema,
  email: emailSchema,
  motDePasse: motDePasseSchema,
  role: z.enum(['CUISINE', 'BAR', 'SERVEUR'], { error: 'Poste attendu : cuisine, bar ou serveur' }),
})

export type Inscription = z.infer<typeof inscriptionSchema>

export const modificationUtilisateurSchema = z
  .strictObject({
    actif: z.boolean({ error: 'actif : true ou false attendu' }).optional(),
    role: z.enum(Role, { error: 'Rôle attendu : ADMIN, CUISINE ou SERVEUR' }).optional(),
  })
  .refine(auMoinsUnChamp, { error: 'Aucune modification demandée' })

export type ModificationUtilisateur = z.infer<typeof modificationUtilisateurSchema>
