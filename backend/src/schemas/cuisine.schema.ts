import { z } from 'zod'

const identifiantsSchema = z
  .array(z.int({ error: 'Identifiant invalide' }).positive({ error: 'Identifiant invalide' }), { error: "Liste d'identifiants attendue" })
  .min(1, { error: 'Aucun élément sélectionné' })
  .max(100, { error: '100 éléments maximum' })
  .refine((ids) => new Set(ids).size === ids.length, { error: 'Identifiant en double' })

export const statutLignesSchema = z.strictObject({
  ligneIds: identifiantsSchema,
  // « Servie » n'est pas proposée : seul le serveur la valide (§6).
  statut: z.enum(['EN_PREPARATION', 'PRETE'], { error: 'Statut invalide' }),
})

export type StatutLignes = z.infer<typeof statutLignesSchema>

export const annulationLigneSchema = z.strictObject({
  motif: z
    .string({ error: "Motif d'annulation obligatoire" })
    .trim()
    .min(3, { error: 'Motif : 3 caractères minimum' })
    .max(200, { error: 'Motif : 200 caractères maximum' }),
})

export type AnnulationLigne = z.infer<typeof annulationLigneSchema>

export const urgenceSchema = z.strictObject({
  commandeIds: identifiantsSchema,
  urgent: z.boolean({ error: 'urgent : true ou false attendu' }),
})

export type Urgence = z.infer<typeof urgenceSchema>
