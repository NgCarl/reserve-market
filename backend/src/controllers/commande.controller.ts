import type { RequestHandler } from 'express'
import type { NouvelleCommande } from '../schemas/commande.schema.js'
import { creerCommandeClient, obtenirCommandeClient } from '../services/commande.service.js'

export const creerCommande: RequestHandler<{ jeton: string }, unknown, NouvelleCommande> = async (req, res) => {
  const { commande, creee } = await creerCommandeClient(req.params.jeton, req.body)
  // 201 à la création, 200 quand la même commande est renvoyée (clé d'idempotence déjà connue).
  res.status(creee ? 201 : 200).json({ commande })
}

export const suivreCommande: RequestHandler<{ jeton: string; commandeId: string }> = async (req, res) => {
  const commande = await obtenirCommandeClient(req.params.jeton, Number(req.params.commandeId))
  res.json({ commande })
}
