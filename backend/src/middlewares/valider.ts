import type { RequestHandler } from 'express'
import { z } from 'zod'
import { ValidationError } from '../lib/errors.js'

/** Valide req.body et le remplace par la donnée nettoyée : espaces retirés, email en minuscules, champs inconnus refusés. */
export const validerBody = (schema: z.ZodType): RequestHandler => (req, _res, next) => {
  const resultat = schema.safeParse(req.body)
  if (!resultat.success) throw new ValidationError('Données invalides', z.flattenError(resultat.error))
  req.body = resultat.data
  next()
}

/**
 * Valide req.query (filtres d'une liste). Express 5 ne permet pas de remplacer req.query :
 * le contrôleur relit la valeur avec le même schéma, déjà vérifié ici, pour la typer.
 */
export const validerQuery = (schema: z.ZodType): RequestHandler => (req, _res, next) => {
  const resultat = schema.safeParse(req.query)
  if (!resultat.success) throw new ValidationError('Paramètres de recherche invalides', z.flattenError(resultat.error))
  next()
}

/** Valide req.params. Express garde les paramètres en chaînes : le contrôleur les convertit ensuite. */
export const validerParams = (schema: z.ZodType): RequestHandler => (req, _res, next) => {
  const resultat = schema.safeParse(req.params)
  if (!resultat.success) throw new ValidationError('Paramètres invalides', z.flattenError(resultat.error))
  next()
}
