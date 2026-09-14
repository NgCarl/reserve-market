import { z } from 'zod'

export const idParamsSchema = z.object({
  id: z.coerce.number({ error: 'Identifiant invalide' }).int({ error: 'Identifiant invalide' }).positive({ error: 'Identifiant invalide' }),
})

/** Montant en francs CFA : entier, jamais de décimale (CLAUDE.md §6). */
export const montantSchema = z
  .int({ error: 'Montant entier en FCFA attendu' })
  .min(0, { error: 'Montant positif attendu' })
  .max(10_000_000, { error: 'Montant trop élevé' })

export const texteSchema = (champ: string, max: number) =>
  z
    .string({ error: `${champ} requis` })
    .trim()
    .min(1, { error: `${champ} requis` })
    .max(max, { error: `${champ} : ${max} caractères maximum` })

export const auMoinsUnChamp = (objet: object): boolean => Object.values(objet).some((valeur) => valeur !== undefined)

export const nomsUniques = (liste: readonly { nom: string }[]): boolean =>
  new Set(liste.map((element) => element.nom.toLocaleLowerCase('fr'))).size === liste.length
