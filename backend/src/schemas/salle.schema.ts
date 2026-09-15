import { z } from 'zod'

const identifiantsSchema = z
  .array(z.int({ error: 'Identifiant invalide' }).positive({ error: 'Identifiant invalide' }), { error: "Liste d'identifiants attendue" })
  .min(1, { error: 'Aucun article sélectionné' })
  .max(100, { error: '100 articles maximum' })
  .refine((ids) => new Set(ids).size === ids.length, { error: 'Identifiant en double' })

const modePaiementSchema = z.enum(['ESPECES', 'MOBILE_MONEY'], { error: 'Mode de paiement attendu : espèces ou Mobile Money' })

/** « Servi » : validé par le serveur, jamais par la cuisine (§6). */
export const lignesServiesSchema = z.strictObject({
  ligneIds: identifiantsSchema,
})

export type LignesServies = z.infer<typeof lignesServiesSchema>

export const encaissementSchema = z.strictObject({
  modePaiement: modePaiementSchema,
})

export type Encaissement = z.infer<typeof encaissementSchema>

/** Bouton du client : appeler le serveur, ou demander l'addition avec le mode de paiement choisi. */
export const demandeAppelSchema = z.discriminatedUnion(
  'type',
  [
    z.strictObject({ type: z.literal('APPEL_SERVEUR') }),
    z.strictObject({ type: z.literal('ADDITION'), modePaiement: modePaiementSchema }),
  ],
  { error: 'Demande inconnue : appel du serveur ou addition' },
)

export type DemandeAppel = z.infer<typeof demandeAppelSchema>
