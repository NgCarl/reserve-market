import { z } from 'zod'
import { auMoinsUnChamp, montantSchema, nomsUniques, texteSchema } from './commun.schema.js'

const optionVarianteSchema = z.strictObject({
  nom: texteSchema('Nom de l\'option', 50),
  supplement: montantSchema,
})

/** Choix unique obligatoire, par exemple « Taille » : 1/4, 1/2, Entier. */
const groupeVarianteSchema = z.strictObject({
  nom: texteSchema('Nom du groupe', 50),
  options: z
    .array(optionVarianteSchema)
    .min(1, { error: 'Au moins une option' })
    .max(20)
    .refine(nomsUniques, { error: 'Deux options portent le même nom' }),
})

const extraSchema = z.strictObject({
  nom: texteSchema('Nom de l\'extra', 50),
  prix: montantSchema,
})

export const nouveauPlatSchema = z.strictObject({
  categorieId: z.int({ error: 'Catégorie requise' }).positive(),
  nom: texteSchema('Nom', 120),
  description: z.string().trim().max(500, { error: 'Description : 500 caractères maximum' }).nullable().optional(),
  prix: montantSchema,
  disponible: z.boolean({ error: 'Booléen attendu' }).optional(),
  /** null : stock non suivi. */
  stock: z.int({ error: 'Stock entier attendu' }).min(0).nullable().optional(),
  tempsPreparationMin: z.int({ error: 'Durée en minutes attendue' }).min(1).max(240).nullable().optional(),
  ordre: z.int().min(0).optional(),
  // Listes complètes : envoyées lors d'une modification, elles remplacent les précédentes.
  groupesVariantes: z.array(groupeVarianteSchema).max(5).refine(nomsUniques, { error: 'Deux groupes portent le même nom' }).optional(),
  extras: z.array(extraSchema).max(30).refine(nomsUniques, { error: 'Deux extras portent le même nom' }).optional(),
  addonIds: z
    .array(z.int().positive())
    .max(30)
    .refine((ids) => new Set(ids).size === ids.length, { error: 'Addon en double' })
    .optional(),
})

export const modificationPlatSchema = nouveauPlatSchema
  .partial()
  .refine(auMoinsUnChamp, { error: 'Aucun champ à modifier' })

/** Champs renvoyés par Cloudinary après l'envoi direct. */
export const photoPlatSchema = z.strictObject({
  publicId: z.string({ error: 'publicId requis' }).min(1).max(255),
  version: z.int({ error: 'version requise' }).positive(),
  signature: z.string({ error: 'signature requise' }).regex(/^[a-f0-9]{40}$/, { error: 'Signature invalide' }),
})

export type NouveauPlat = z.infer<typeof nouveauPlatSchema>
export type ModificationPlat = z.infer<typeof modificationPlatSchema>
export type PhotoPlat = z.infer<typeof photoPlatSchema>
