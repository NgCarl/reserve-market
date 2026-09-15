import type { RequestHandler } from 'express'
import { utilisateurConnecte } from '../middlewares/authentifier.js'
import type { CommandeServeur } from '../schemas/commande.schema.js'
import type { AnnulationLigne } from '../schemas/cuisine.schema.js'
import type { Encaissement, LignesServies } from '../schemas/salle.schema.js'
import { creerCommandeServeur } from '../services/commande.service.js'
import { menuServeur } from '../services/menu.service.js'
import { annulerLigneServeur, encaisserTable, etatSalle, servirLignes, traiterAppel } from '../services/salle.service.js'

type Params = Record<string, string>

export const obtenirSalle: RequestHandler = async (_req, res) => {
  res.json(await etatSalle(utilisateurConnecte(res).restaurantId))
}

export const obtenirMenuServeur: RequestHandler = async (_req, res) => {
  res.json(await menuServeur(utilisateurConnecte(res).restaurantId))
}

export const creerCommande: RequestHandler<Params, unknown, CommandeServeur> = async (req, res) => {
  const serveur = utilisateurConnecte(res)
  const { commande, creee } = await creerCommandeServeur(serveur.restaurantId, serveur.id, req.body)
  // 201 à la création, 200 quand la même commande est renvoyée (clé d'idempotence déjà connue).
  res.status(creee ? 201 : 200).json({ commande })
}

export const servir: RequestHandler<Params, unknown, LignesServies> = async (req, res) => {
  const serveur = utilisateurConnecte(res)
  await servirLignes(serveur.restaurantId, serveur.id, req.body.ligneIds)
  res.status(204).end()
}

export const annuler: RequestHandler<{ id: string }, unknown, AnnulationLigne> = async (req, res) => {
  const serveur = utilisateurConnecte(res)
  await annulerLigneServeur(serveur.restaurantId, serveur.id, Number(req.params.id), req.body.motif)
  res.status(204).end()
}

export const encaisser: RequestHandler<{ id: string }, unknown, Encaissement> = async (req, res) => {
  const serveur = utilisateurConnecte(res)
  res.json({ encaissement: await encaisserTable(serveur.restaurantId, serveur.id, Number(req.params.id), req.body.modePaiement) })
}

export const traiter: RequestHandler<{ id: string }> = async (req, res) => {
  const serveur = utilisateurConnecte(res)
  await traiterAppel(serveur.restaurantId, serveur.id, Number(req.params.id))
  res.status(204).end()
}
