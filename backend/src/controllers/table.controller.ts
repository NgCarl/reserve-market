import type { Request, RequestHandler } from 'express'
import { env } from '../lib/env.js'
import { utilisateurConnecte } from '../middlewares/authentifier.js'
import type { ModificationTable, NouvelleTable } from '../schemas/table.schema.js'
import {
  creerTable,
  listerTables,
  modifierTable,
  obtenirTable,
  qrCodeTable,
  regenererJeton,
  supprimerTable,
} from '../services/table.service.js'

type Params = Record<string, string>

/**
 * Adresse encodée dans les QR : URL_PUBLIQUE en production, sinon l'adresse par laquelle l'admin ouvre le site.
 * req.protocol tient compte de trust proxy (https derrière Render).
 */
const adresseSite = (req: Pick<Request, 'protocol' | 'get'>): string =>
  env.URL_PUBLIQUE ?? `${req.protocol}://${req.get('host') ?? 'localhost'}`

export const lister: RequestHandler = async (req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  res.json(await listerTables(restaurantId, adresseSite(req)))
}

export const obtenir: RequestHandler<{ id: string }> = async (req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  res.json(await obtenirTable(restaurantId, Number(req.params.id), adresseSite(req)))
}

export const creer: RequestHandler<Params, unknown, NouvelleTable> = async (req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  res.status(201).json({ table: await creerTable(restaurantId, req.body, adresseSite(req)) })
}

export const modifier: RequestHandler<{ id: string }, unknown, ModificationTable> = async (req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  res.json({ table: await modifierTable(restaurantId, Number(req.params.id), req.body, adresseSite(req)) })
}

export const regenerer: RequestHandler<{ id: string }> = async (req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  res.json({ table: await regenererJeton(restaurantId, Number(req.params.id), adresseSite(req)) })
}

export const supprimer: RequestHandler<{ id: string }> = async (req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  await supprimerTable(restaurantId, Number(req.params.id))
  res.status(204).end()
}

export const qrCode: RequestHandler<{ id: string }> = async (req, res) => {
  const { restaurantId } = utilisateurConnecte(res)
  const svg = await qrCodeTable(restaurantId, Number(req.params.id), adresseSite(req))
  // Le QR contient le jeton d'accès de la table : jamais gardé en cache hors de la session de l'admin.
  res.type('image/svg+xml').set('Cache-Control', 'private, no-store').send(svg)
}
