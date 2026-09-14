import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Role } from '../generated/prisma/client.js'

export const emailSchema = z
  .string({ error: 'Email requis' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Email invalide' }))

export const nouvelUtilisateurSchema = z.strictObject({
  nom: z.string({ error: 'Nom requis' }).trim().min(1, { error: 'Nom requis' }).max(100),
  email: emailSchema,
  motDePasse: z
    .string({ error: 'Mot de passe requis' })
    .min(8, { error: 'Au moins 8 caractères' })
    .max(128, { error: '128 caractères maximum' })
    .regex(/\p{Lu}/u, { error: 'Au moins une majuscule' })
    .regex(/[0-9]/, { error: 'Au moins un chiffre' })
    // bcrypt ignore tout ce qui dépasse 72 octets (un caractère accentué en compte 2) : on refuse plutôt que tronquer.
    .refine((motDePasse) => !bcrypt.truncates(motDePasse), { error: 'Mot de passe trop long (72 octets maximum)' }),
  role: z.enum(Role, { error: 'Rôle attendu : ADMIN, CUISINE ou SERVEUR' }),
})

export type NouvelUtilisateur = z.infer<typeof nouvelUtilisateurSchema>
