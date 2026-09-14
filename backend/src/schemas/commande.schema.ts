import { z } from 'zod'
import { jetonParamsSchema } from './menu.schema.js'

const identifiantsSchema = (max: number) =>
  z
    .array(z.int({ error: 'Identifiant invalide' }).positive())
    .max(max)
    .refine((ids) => new Set(ids).size === ids.length, { error: 'Identifiant en double' })

// Le client n'envoie que ses choix : aucun prix. Le serveur recalcule tout à partir de la base (CLAUDE.md §6).
const ligneSchema = z.strictObject({
  platId: z.int({ error: 'Article invalide' }).positive(),
  quantite: z.int({ error: 'Quantité entière attendue' }).min(1, { error: 'Quantité minimale : 1' }).max(50, { error: 'Quantité maximale : 50' }),
  optionIds: identifiantsSchema(10).default([]),
  extraIds: identifiantsSchema(30).default([]),
  note: z.string().trim().max(200, { error: 'Instruction : 200 caractères maximum' }).default(''),
})

export const nouvelleCommandeSchema = z.strictObject({
  /** UUID généré par le panier : un renvoi avec la même clé ne crée pas de seconde commande. */
  cleIdempotence: z.uuid({ error: 'Clé de commande invalide' }),
  chaise: z.int({ error: 'Choisissez votre place' }).positive({ error: 'Choisissez votre place' }),
  lignes: z
    .array(ligneSchema, { error: 'Le panier est vide' })
    .min(1, { error: 'Le panier est vide' })
    .max(50, { error: 'Commande trop longue : 50 lignes maximum' }),
})

export type NouvelleCommande = z.infer<typeof nouvelleCommandeSchema>

export const suiviParamsSchema = jetonParamsSchema.extend({
  commandeId: z.coerce.number({ error: 'Commande invalide' }).int({ error: 'Commande invalide' }).positive({ error: 'Commande invalide' }),
})
