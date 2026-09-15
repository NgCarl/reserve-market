import type { RequestHandler } from 'express'
import { utilisateurConnecte } from '../middlewares/authentifier.js'
import type { AnnulationLigne, StatutLignes, Urgence } from '../schemas/cuisine.schema.js'
import { annulerLigne, changerStatutLignes, listerCommandesCuisine, marquerUrgent } from '../services/cuisine.service.js'

type Params = Record<string, string>

export const listerCommandes: RequestHandler = async (_req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  res.json({ commandes: await listerCommandesCuisine(restaurantId) })
}

export const changerStatut: RequestHandler<Params, unknown, StatutLignes> = async (req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  res.json({ commandes: await changerStatutLignes(restaurantId, req.body.ligneIds, req.body.statut) })
}

export const annuler: RequestHandler<{ id: string }, unknown, AnnulationLigne> = async (req, res) => {
  const { id, restaurantId } = utilisateurConnecte(res)
  res.json({ commande: await annulerLigne(restaurantId, id, Number(req.params.id), req.body.motif) })
}

export const changerUrgence: RequestHandler<Params, unknown, Urgence> = async (req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  res.json({ commandes: await marquerUrgent(restaurantId, req.body.commandeIds, req.body.urgent) })
}
