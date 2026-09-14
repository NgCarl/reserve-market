import type { RequestHandler } from 'express'
import { utilisateurConnecte } from '../middlewares/authentifier.js'
import type { NouvelUtilisateur } from '../schemas/utilisateur.schema.js'
import { creerUtilisateur, listerUtilisateurs } from '../services/utilisateur.service.js'

type Params = Record<string, string>

export const lister: RequestHandler = async (_req, res) => {
  const utilisateurs = await listerUtilisateurs(utilisateurConnecte(res).restaurantId)
  res.json({ utilisateurs })
}

export const creer: RequestHandler<Params, unknown, NouvelUtilisateur> = async (req, res) => {
  const utilisateur = await creerUtilisateur(utilisateurConnecte(res).restaurantId, req.body)
  res.status(201).json({ utilisateur })
}
