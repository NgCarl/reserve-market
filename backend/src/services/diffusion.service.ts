import { prisma } from '../lib/prisma.js'
import { salles, tempsReel, type EvenementCommande } from '../sockets/io.js'
import { formaterCommande, formaterCommandeCuisine, selectCommandeCuisine } from './commande.format.js'

async function diffuserCommande(commandeId: number, evenement: EvenementCommande): Promise<void> {
  const io = tempsReel()
  if (!io) return
  // Relue après l'écriture : on diffuse l'état enregistré, jamais une supposition.
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    select: { ...selectCommandeCuisine, restaurantId: true },
  })
  if (!commande) return

  const { restaurantId } = commande
  // Un admin présent dans les deux salles ne reçoit l'événement qu'une fois.
  io.to(salles.cuisine(restaurantId)).to(salles.serveur(restaurantId)).emit(evenement, formaterCommandeCuisine(commande))
  // La table ne reçoit que les changements de ses propres commandes, au format public (§9).
  if (evenement !== 'commande:nouvelle') {
    io.to(salles.table(restaurantId, commande.table.id)).emit(evenement, formaterCommande(commande))
  }
}

/**
 * Prévient la cuisine, les serveurs et la table, une fois la modification enregistrée.
 * Sans attendre : un échec de diffusion ne fait pas échouer l'action, et les écrans rechargent l'état à la reconnexion (§7).
 */
export function diffuser(commandeIds: readonly number[], evenement: EvenementCommande): void {
  for (const commandeId of commandeIds) {
    diffuserCommande(commandeId, evenement).catch((error: unknown) => {
      console.error(`Diffusion ${evenement} impossible pour la commande ${commandeId}`, error)
    })
  }
}
