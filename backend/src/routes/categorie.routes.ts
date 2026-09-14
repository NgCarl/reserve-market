import { Router } from 'express'
import { archiver, creer, lister, modifier } from '../controllers/categorie.controller.js'
import { authentifier, exigerRole } from '../middlewares/authentifier.js'
import { validerBody, validerParams } from '../middlewares/valider.js'
import { modificationCategorieSchema, nouvelleCategorieSchema } from '../schemas/categorie.schema.js'
import { idParamsSchema } from '../schemas/commun.schema.js'

const router = Router()

router.use(authentifier, exigerRole('ADMIN'))
router.get('/', lister)
router.post('/', validerBody(nouvelleCategorieSchema), creer)
router.patch('/:id', validerParams(idParamsSchema), validerBody(modificationCategorieSchema), modifier)
router.delete('/:id', validerParams(idParamsSchema), archiver)

export default router
