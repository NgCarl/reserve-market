import { Router } from 'express'
import { listerCommandes, obtenirCommande, obtenirTableauDeBord } from '../controllers/gestion.controller.js'
import { modifierPaiement, obtenirRestaurant } from '../controllers/restaurant.controller.js'
import { authentifier, exigerRole } from '../middlewares/authentifier.js'
import { validerBody, validerParams, validerQuery } from '../middlewares/valider.js'
import { idParamsSchema } from '../schemas/commun.schema.js'
import { commandesQuerySchema, journeeQuerySchema } from '../schemas/gestion.schema.js'
import { reglagesPaiementSchema } from '../schemas/restaurant.schema.js'

const router = Router()

// Suivi du restaurant, réservé aux admins : lecture seule. Le service (préparer, servir, encaisser) reste aux écrans dédiés.
router.use(authentifier, exigerRole('ADMIN'))

router.get('/tableau-de-bord', validerQuery(journeeQuerySchema), obtenirTableauDeBord)
router.get('/commandes', validerQuery(commandesQuerySchema), listerCommandes)
router.get('/commandes/:id', validerParams(idParamsSchema), obtenirCommande)

// Réglages du restaurant : numéros marchands Orange Money et MTN MoMo affichés au client (§4).
router.get('/restaurant', obtenirRestaurant)
router.patch('/restaurant/paiement', validerBody(reglagesPaiementSchema), modifierPaiement)

export default router
