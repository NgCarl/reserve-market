import { Router } from 'express'
import { listerCommandes, obtenirCommande, obtenirTableauDeBord } from '../controllers/gestion.controller.js'
import { authentifier, exigerRole } from '../middlewares/authentifier.js'
import { validerParams, validerQuery } from '../middlewares/valider.js'
import { idParamsSchema } from '../schemas/commun.schema.js'
import { commandesQuerySchema, journeeQuerySchema } from '../schemas/gestion.schema.js'

const router = Router()

// Suivi du restaurant, réservé aux admins : lecture seule. Le service (préparer, servir, encaisser) reste aux écrans dédiés.
router.use(authentifier, exigerRole('ADMIN'))

router.get('/tableau-de-bord', validerQuery(journeeQuerySchema), obtenirTableauDeBord)
router.get('/commandes', validerQuery(commandesQuerySchema), listerCommandes)
router.get('/commandes/:id', validerParams(idParamsSchema), obtenirCommande)

export default router
