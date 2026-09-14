import { Router } from 'express'
import { checkAuth, login, logout } from '../controllers/auth.controller.js'
import { authentifier } from '../middlewares/authentifier.js'
import { limiteurConnexion } from '../middlewares/limiteur.js'
import { validerBody } from '../middlewares/valider.js'
import { connexionSchema } from '../schemas/auth.schema.js'

const router = Router()

// Limiteur avant la validation : une requête mal formée compte aussi comme un échec.
router.post('/login', limiteurConnexion, validerBody(connexionSchema), login)
router.post('/logout', logout)
router.get('/check-auth', authentifier, checkAuth)

export default router
