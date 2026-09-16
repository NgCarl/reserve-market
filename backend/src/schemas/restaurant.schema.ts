import { z } from 'zod'

/**
 * Numéro Mobile Money camerounais : 9 chiffres commençant par 6, avec ou sans indicatif +237.
 * Les espaces sont retirés avant vérification, et le numéro est enregistré sans indicatif.
 */
const numeroMobileMoney = z
  .string()
  .trim()
  .transform((valeur) => valeur.replaceAll(/[\s.-]/g, '').replace(/^\+?237/, ''))
  .pipe(z.string().regex(/^6\d{8}$/, { error: 'Numéro attendu : 9 chiffres commençant par 6' }))

/** Chaîne vide dans un formulaire = numéro retiré. */
const numeroOuVide = z.preprocess((valeur) => (valeur === '' ? null : valeur), numeroMobileMoney.nullable())

export const reglagesPaiementSchema = z.strictObject({
  numeroOrangeMoney: numeroOuVide,
  numeroMtnMomo: numeroOuVide,
})

export type ReglagesPaiement = z.infer<typeof reglagesPaiementSchema>
