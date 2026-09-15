import { z } from 'zod'

const jourSchema = z.iso.date({ error: 'Date attendue au format AAAA-MM-JJ' })

export const journeeQuerySchema = z.object({
  date: jourSchema.optional(),
})

export type JourneeQuery = z.infer<typeof journeeQuerySchema>

export const commandesQuerySchema = z.object({
  date: jourSchema.optional(),
  statut: z.enum(['RECUE', 'EN_PREPARATION', 'PRETE', 'SERVIE', 'ANNULEE'], { error: 'Statut inconnu' }).optional(),
  /** Numéro de la table, celui que connaît le personnel. */
  table: z.coerce.number({ error: 'Numéro de table invalide' }).int({ error: 'Numéro de table invalide' }).positive({ error: 'Numéro de table invalide' }).optional(),
})

export type CommandesQuery = z.infer<typeof commandesQuerySchema>
