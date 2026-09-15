import { Router } from 'express'
import { checkAuth, inscription, login, logout } from '../controllers/auth.controller.js'
import { authentifier } from '../middlewares/authentifier.js'
import { limiteurConnexion, limiteurInscription } from '../middlewares/limiteur.js'
import { validerBody } from '../middlewares/valider.js'
import { connexionSchema } from '../schemas/auth.schema.js'
import { inscriptionSchema } from '../schemas/utilisateur.schema.js'

const router = Router()

// Limiteur avant la validation : une requête mal formée compte aussi comme un échec.
router.post('/login', limiteurConnexion, validerBody(connexionSchema), login)
// Inscription du personnel : compte inactif jusqu'à son activation par un admin.
router.post('/inscription', limiteurInscription, validerBody(inscriptionSchema), inscription)
router.post('/logout', logout)
router.get('/check-auth', authentifier, checkAuth)

export default router
