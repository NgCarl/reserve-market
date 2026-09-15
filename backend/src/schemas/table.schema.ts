import { z } from 'zod'
import { auMoinsUnChamp } from './commun.schema.js'

const numeroSchema = z
  .int({ error: 'Numéro de table entier attendu' })
  .min(1, { error: 'Numéro minimum : 1' })
  .max(999, { error: 'Numéro maximum : 999' })

// Chaque table a son propre nombre de places : il fixe les boutons « votre place » proposés au client.
const nombreChaisesSchema = z
  .int({ error: 'Nombre de places entier attendu' })
  .min(1, { error: 'Au moins 1 place' })
  .max(30, { error: '30 places maximum' })

export const nouvelleTableSchema = z.strictObject({
  numero: numeroSchema,
  nombreChaises: nombreChaisesSchema,
})

export type NouvelleTable = z.infer<typeof nouvelleTableSchema>

export const modificationTableSchema = z
  .strictObject({
    numero: numeroSchema.optional(),
    nombreChaises: nombreChaisesSchema.optional(),
  })
  .refine(auMoinsUnChamp, { error: 'Aucune modification demandée' })

export type ModificationTable = z.infer<typeof modificationTableSchema>
