import { Router } from 'express'
import { creerCommande, listerCommandesDeLaTable, suivreCommande } from '../controllers/commande.controller.js'
import { obtenirMenu } from '../controllers/menu.controller.js'
import { limiteurCommande } from '../middlewares/limiteur.js'
import { validerBody, validerParams } from '../middlewares/valider.js'
import { nouvelleCommandeSchema, suiviParamsSchema } from '../schemas/commande.schema.js'
import { jetonParamsSchema } from '../schemas/menu.schema.js'

const router = Router()

// Public : le client n'a pas de compte, le jeton du QR suffit (CLAUDE.md §6).
router.get('/:jeton', validerParams(jetonParamsSchema), obtenirMenu)
router.post('/:jeton/commandes', validerParams(jetonParamsSchema), limiteurCommande, validerBody(nouvelleCommandeSchema), creerCommande)
router.get('/:jeton/commandes', validerParams(jetonParamsSchema), listerCommandesDeLaTable)
router.get('/:jeton/commandes/:commandeId', validerParams(suiviParamsSchema), suivreCommande)

export default router
