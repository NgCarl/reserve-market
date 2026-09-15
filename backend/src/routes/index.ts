import { Router } from 'express'
import authRoutes from './auth.routes.js'
import categorieRoutes from './categorie.routes.js'
import cuisineRoutes from './cuisine.routes.js'
import gestionRoutes from './gestion.routes.js'
import menuRoutes from './menu.routes.js'
import platRoutes from './plat.routes.js'
import salleRoutes from './salle.routes.js'
import tableRoutes from './table.routes.js'
import utilisateurRoutes from './utilisateur.routes.js'

const apiRoutes = Router()

apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/utilisateurs', utilisateurRoutes)
apiRoutes.use('/categories', categorieRoutes)
apiRoutes.use('/plats', platRoutes)
apiRoutes.use('/menu', menuRoutes)
apiRoutes.use('/cuisine', cuisineRoutes)
apiRoutes.use('/tables', tableRoutes)
apiRoutes.use('/gestion', gestionRoutes)
apiRoutes.use('/serveur', salleRoutes)

export default apiRoutes
