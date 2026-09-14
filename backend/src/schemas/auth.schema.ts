import { z } from 'zod'
import { emailSchema } from './utilisateur.schema.js'

export const connexionSchema = z.strictObject({
  email: emailSchema,
  // Aucune règle de longueur minimale ici : elle révélerait la politique de mot de passe.
  motDePasse: z.string({ error: 'Mot de passe requis' }).min(1, { error: 'Mot de passe requis' }).max(128),
})

export type Connexion = z.infer<typeof connexionSchema>
