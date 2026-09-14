import { z } from 'zod'
import { Poste } from '../generated/prisma/client.js'
import { auMoinsUnChamp, texteSchema } from './commun.schema.js'

export const nouvelleCategorieSchema = z.strictObject({
  nom: texteSchema('Nom', 80),
  poste: z.enum(Poste, { error: 'Poste attendu : BAR ou CUISINE' }),
  ordre: z.int({ error: 'Ordre entier attendu' }).min(0).optional(),
})

export const modificationCategorieSchema = nouvelleCategorieSchema
  .partial()
  .refine(auMoinsUnChamp, { error: 'Aucun champ à modifier' })

export type NouvelleCategorie = z.infer<typeof nouvelleCategorieSchema>
export type ModificationCategorie = z.infer<typeof modificationCategorieSchema>
