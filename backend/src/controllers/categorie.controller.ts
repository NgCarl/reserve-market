import type { RequestHandler } from 'express'
import { utilisateurConnecte } from '../middlewares/authentifier.js'
import type { ModificationCategorie, NouvelleCategorie } from '../schemas/categorie.schema.js'
import { archiverCategorie, creerCategorie, listerCategories, modifierCategorie } from '../services/categorie.service.js'

type ParamsId = { id: string }

export const lister: RequestHandler = async (_req, res) => {
  const categories = await listerCategories(utilisateurConnecte(res).restaurantId)
  res.json({ categories })
}

export const creer: RequestHandler<Record<string, string>, unknown, NouvelleCategorie> = async (req, res) => {
  const categorie = await creerCategorie(utilisateurConnecte(res).restaurantId, req.body)
  res.status(201).json({ categorie })
}

export const modifier: RequestHandler<ParamsId, unknown, ModificationCategorie> = async (req, res) => {
  const categorie = await modifierCategorie(utilisateurConnecte(res).restaurantId, Number(req.params.id), req.body)
  res.json({ categorie })
}

export const archiver: RequestHandler<ParamsId> = async (req, res) => {
  await archiverCategorie(utilisateurConnecte(res).restaurantId, Number(req.params.id))
  res.status(204).end()
}
