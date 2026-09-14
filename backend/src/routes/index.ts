import { Router } from 'express'
import authRoutes from './auth.routes.js'
import utilisateurRoutes from './utilisateur.routes.js'

const apiRoutes = Router()

apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/utilisateurs', utilisateurRoutes)

export default apiRoutes
