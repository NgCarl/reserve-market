import type { RequestHandler } from 'express'
import { utilisateurConnecte } from '../middlewares/authentifier.js'
import { commandesQuerySchema, journeeQuerySchema } from '../schemas/gestion.schema.js'
import { listerCommandesJournee, obtenirCommandeAdmin, tableauDeBord } from '../services/gestion.service.js'

// req.query a déjà été validée par validerQuery : parse ne fait ici que la typer et appliquer les conversions.

export const obtenirTableauDeBord: RequestHandler = async (req, res) => {
  const { date } = journeeQuerySchema.parse(req.query)
  res.json(await tableauDeBord(utilisateurConnecte(res).restaurantId, date))
}

export const listerCommandes: RequestHandler = async (req, res) => {
  const filtres = commandesQuerySchema.parse(req.query)
  res.json(await listerCommandesJournee(utilisateurConnecte(res).restaurantId, filtres))
}

export const obtenirCommande: RequestHandler<{ id: string }> = async (req, res) => {
  const commande = await obtenirCommandeAdmin(utilisateurConnecte(res).restaurantId, Number(req.params.id))
  res.json({ commande })
}
