import { Router } from 'express'
import { creer, lister, modifier, obtenir, qrCode, regenerer, supprimer } from '../controllers/table.controller.js'
import { authentifier, exigerRole } from '../middlewares/authentifier.js'
import { validerBody, validerParams } from '../middlewares/valider.js'
import { idParamsSchema } from '../schemas/commun.schema.js'
import { modificationTableSchema, nouvelleTableSchema } from '../schemas/table.schema.js'

const router = Router()

// Tables et QR codes : réservés aux admins.
router.use(authentifier, exigerRole('ADMIN'))

router.get('/', lister)
router.post('/', validerBody(nouvelleTableSchema), creer)
router.get('/:id', validerParams(idParamsSchema), obtenir)
router.patch('/:id', validerParams(idParamsSchema), validerBody(modificationTableSchema), modifier)
router.delete('/:id', validerParams(idParamsSchema), supprimer)
router.post('/:id/jeton', validerParams(idParamsSchema), regenerer)
router.get('/:id/qr.svg', validerParams(idParamsSchema), qrCode)

export default router
