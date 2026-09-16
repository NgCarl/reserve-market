import { Router } from 'express'
import { annuler, changerStatut, changerUrgence, listerCommandes } from '../controllers/cuisine.controller.js'
import { authentifier, exigerRole } from '../middlewares/authentifier.js'
import { validerBody, validerParams } from '../middlewares/valider.js'
import { idParamsSchema } from '../schemas/commun.schema.js'
import { annulationLigneSchema, statutLignesSchema, urgenceSchema } from '../schemas/cuisine.schema.js'

const router = Router()

// Écran cuisine et bar. L'admin y a accès pour superviser le service.
router.use(authentifier, exigerRole('CUISINE', 'BAR', 'ADMIN'))

router.get('/commandes', listerCommandes)
router.patch('/commandes/urgence', validerBody(urgenceSchema), changerUrgence)
router.patch('/lignes/statut', validerBody(statutLignesSchema), changerStatut)
router.post('/lignes/:id/annulation', validerParams(idParamsSchema), validerBody(annulationLigneSchema), annuler)

export default router
