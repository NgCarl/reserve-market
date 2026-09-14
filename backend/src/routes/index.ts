import { Router } from 'express'
import authRoutes from './auth.routes.js'
import categorieRoutes from './categorie.routes.js'
import platRoutes from './plat.routes.js'
import utilisateurRoutes from './utilisateur.routes.js'

const apiRoutes = Router()

apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/utilisateurs', utilisateurRoutes)
apiRoutes.use('/categories', categorieRoutes)
apiRoutes.use('/plats', platRoutes)

export default apiRoutes
