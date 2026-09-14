import type { RequestHandler } from 'express'
import { utilisateurConnecte } from '../middlewares/authentifier.js'
import type { ModificationPlat, NouveauPlat, PhotoPlat } from '../schemas/plat.schema.js'
import { signerEnvoiPhoto } from '../services/photo.service.js'
import {
  archiverPlat,
  creerPlat,
  definirPhoto,
  listerPlats,
  modifierPlat,
  obtenirPlat,
  retirerPhoto,
} from '../services/plat.service.js'

type ParamsId = { id: string }

export const lister: RequestHandler = async (_req, res) => {
  const plats = await listerPlats(utilisateurConnecte(res).restaurantId)
  res.json({ plats })
}

export const obtenir: RequestHandler<ParamsId> = async (req, res) => {
  const plat = await obtenirPlat(utilisateurConnecte(res).restaurantId, Number(req.params.id))
  res.json({ plat })
}

export const creer: RequestHandler<Record<string, string>, unknown, NouveauPlat> = async (req, res) => {
  const plat = await creerPlat(utilisateurConnecte(res).restaurantId, req.body)
  res.status(201).json({ plat })
}

export const modifier: RequestHandler<ParamsId, unknown, ModificationPlat> = async (req, res) => {
  const plat = await modifierPlat(utilisateurConnecte(res).restaurantId, Number(req.params.id), req.body)
  res.json({ plat })
}

export const archiver: RequestHandler<ParamsId> = async (req, res) => {
  await archiverPlat(utilisateurConnecte(res).restaurantId, Number(req.params.id))
  res.status(204).end()
}

export const signerPhoto: RequestHandler = (_req, res) => {
  res.json(signerEnvoiPhoto())
}

export const enregistrerPhoto: RequestHandler<ParamsId, unknown, PhotoPlat> = async (req, res) => {
  const plat = await definirPhoto(utilisateurConnecte(res).restaurantId, Number(req.params.id), req.body)
  res.json({ plat })
}

export const supprimerPhoto: RequestHandler<ParamsId> = async (req, res) => {
  const plat = await retirerPhoto(utilisateurConnecte(res).restaurantId, Number(req.params.id))
  res.json({ plat })
}
