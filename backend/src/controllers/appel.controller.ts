import type { RequestHandler } from 'express'
import type { DemandeAppel } from '../schemas/salle.schema.js'
import { appelerDepuisTable } from '../services/appel.service.js'

export const appeler: RequestHandler<{ jeton: string }, unknown, DemandeAppel> = async (req, res) => {
  res.status(201).json({ appel: await appelerDepuisTable(req.params.jeton, req.body) })
}
