import { Router } from 'express'
import {
  archiver,
  creer,
  enregistrerPhoto,
  lister,
  modifier,
  obtenir,
  signerPhoto,
  supprimerPhoto,
} from '../controllers/plat.controller.js'
import { authentifier, exigerRole } from '../middlewares/authentifier.js'
import { validerBody, validerParams } from '../middlewares/valider.js'
import { idParamsSchema } from '../schemas/commun.schema.js'
import { modificationPlatSchema, nouveauPlatSchema, photoPlatSchema } from '../schemas/plat.schema.js'

const router = Router()

router.use(authentifier, exigerRole('ADMIN'))
router.post('/photo/signature', signerPhoto)
router.get('/', lister)
router.get('/:id', validerParams(idParamsSchema), obtenir)
router.post('/', validerBody(nouveauPlatSchema), creer)
router.patch('/:id', validerParams(idParamsSchema), validerBody(modificationPlatSchema), modifier)
router.delete('/:id', validerParams(idParamsSchema), archiver)
router.put('/:id/photo', validerParams(idParamsSchema), validerBody(photoPlatSchema), enregistrerPhoto)
router.delete('/:id/photo', validerParams(idParamsSchema), supprimerPhoto)

export default router
