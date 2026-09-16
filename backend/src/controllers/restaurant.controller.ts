import type { RequestHandler } from 'express'
import { utilisateurConnecte } from '../middlewares/authentifier.js'
import type { ReglagesPaiement } from '../schemas/restaurant.schema.js'
import { modifierReglagesPaiement, obtenirReglages } from '../services/restaurant.service.js'

export const obtenirRestaurant: RequestHandler = async (_req, res) => {
  res.json({ restaurant: await obtenirReglages(utilisateurConnecte(res).restaurantId) })
}

export const modifierPaiement: RequestHandler<Record<string, string>, unknown, ReglagesPaiement> = async (req, res) => {
  res.json({ restaurant: await modifierReglagesPaiement(utilisateurConnecte(res).restaurantId, req.body) })
}
