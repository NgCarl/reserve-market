import { Router } from 'express'
import { obtenirMenu } from '../controllers/menu.controller.js'
import { validerParams } from '../middlewares/valider.js'
import { jetonParamsSchema } from '../schemas/menu.schema.js'

const router = Router()

// Public : le client n'a pas de compte, le jeton du QR suffit (CLAUDE.md §6).
router.get('/:jeton', validerParams(jetonParamsSchema), obtenirMenu)

export default router
