import { Router } from 'express'
import { creer, lister } from '../controllers/utilisateur.controller.js'
import { authentifier, exigerRole } from '../middlewares/authentifier.js'
import { validerBody } from '../middlewares/valider.js'
import { nouvelUtilisateurSchema } from '../schemas/utilisateur.schema.js'

const router = Router()

// Pas d'inscription publique : seul un admin crée les comptes du personnel.
router.use(authentifier, exigerRole('ADMIN'))
router.get('/', lister)
router.post('/', validerBody(nouvelUtilisateurSchema), creer)

export default router
