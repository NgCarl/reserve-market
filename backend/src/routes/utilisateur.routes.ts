import { Router } from 'express'
import { creer, lister, modifier } from '../controllers/utilisateur.controller.js'
import { authentifier, exigerRole } from '../middlewares/authentifier.js'
import { validerBody, validerParams } from '../middlewares/valider.js'
import { idParamsSchema } from '../schemas/commun.schema.js'
import { modificationUtilisateurSchema, nouvelUtilisateurSchema } from '../schemas/utilisateur.schema.js'

const router = Router()

// Gestion du personnel, réservée aux admins. Les inscriptions (POST /api/auth/inscription) arrivent inactives.
router.use(authentifier, exigerRole('ADMIN'))
router.get('/', lister)
router.post('/', validerBody(nouvelUtilisateurSchema), creer)
router.patch('/:id', validerParams(idParamsSchema), validerBody(modificationUtilisateurSchema), modifier)

export default router
