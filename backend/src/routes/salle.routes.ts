import { Router } from 'express'
import { annuler, creerCommande, encaisser, obtenirMenuServeur, obtenirSalle, servir, traiter } from '../controllers/salle.controller.js'
import { authentifier, exigerRole } from '../middlewares/authentifier.js'
import { validerBody, validerParams } from '../middlewares/valider.js'
import { commandeServeurSchema } from '../schemas/commande.schema.js'
import { idParamsSchema } from '../schemas/commun.schema.js'
import { annulationLigneSchema } from '../schemas/cuisine.schema.js'
import { encaissementSchema, lignesServiesSchema } from '../schemas/salle.schema.js'

const router = Router()

// Téléphone du serveur (§7). L'admin y a accès pour dépanner en plein service.
router.use(authentifier, exigerRole('SERVEUR', 'ADMIN'))

router.get('/salle', obtenirSalle)
router.get('/menu', obtenirMenuServeur)
router.post('/commandes', validerBody(commandeServeurSchema), creerCommande)
router.patch('/lignes/servies', validerBody(lignesServiesSchema), servir)
router.post('/lignes/:id/annulation', validerParams(idParamsSchema), validerBody(annulationLigneSchema), annuler)
router.post('/tables/:id/encaissement', validerParams(idParamsSchema), validerBody(encaissementSchema), encaisser)
router.patch('/appels/:id/traite', validerParams(idParamsSchema), traiter)

export default router
