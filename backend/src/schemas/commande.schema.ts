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

const lignesSchema = z
  .array(ligneSchema, { error: 'Le panier est vide' })
  .min(1, { error: 'Le panier est vide' })
  .max(50, { error: 'Commande trop longue : 50 lignes maximum' })

/** UUID généré par le panier : un renvoi avec la même clé ne crée pas de seconde commande. */
const cleIdempotenceSchema = z.uuid({ error: 'Clé de commande invalide' })

export const nouvelleCommandeSchema = z.strictObject({
  cleIdempotence: cleIdempotenceSchema,
  chaise: z.int({ error: 'Choisissez votre place' }).positive({ error: 'Choisissez votre place' }),
  lignes: lignesSchema,
})

export type NouvelleCommande = z.infer<typeof nouvelleCommandeSchema>

/** Saisie par un serveur pour un client sans téléphone (§7) : table choisie dans la liste, place facultative. */
export const commandeServeurSchema = z.strictObject({
  tableId: z.int({ error: 'Choisissez une table' }).positive({ error: 'Choisissez une table' }),
  cleIdempotence: cleIdempotenceSchema,
  chaise: z.int({ error: 'Place invalide' }).positive({ error: 'Place invalide' }).nullable().default(null),
  lignes: lignesSchema,
})

export type CommandeServeur = z.infer<typeof commandeServeurSchema>

export const suiviParamsSchema = jetonParamsSchema.extend({
  commandeId: z.coerce.number({ error: 'Commande invalide' }).int({ error: 'Commande invalide' }).positive({ error: 'Commande invalide' }),
})
