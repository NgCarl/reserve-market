import type { RequestHandler } from 'express'
import { menuDeLaTable } from '../services/menu.service.js'

export const obtenirMenu: RequestHandler<{ jeton: string }> = async (req, res) => {
  const menu = await menuDeLaTable(req.params.jeton)
  res.json(menu)
}
