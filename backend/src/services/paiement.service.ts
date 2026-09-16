import { ConflictError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import type { ModePaiement } from '../generated/prisma/enums.js'

/**
 * Abstraction du paiement (CLAUDE.md §4, étape 10).
 * Une seule implémentation aujourd'hui : le paiement est constaté par le serveur, qui reçoit l'argent à table
 * (espèces, ou transfert Mobile Money vers le numéro marchand du restaurant). Aucune passerelle n'est appelée.
 * Le jour où le restaurant aura son compte marchand, il suffira d'ajouter un prestataire qui implémente
 * `Prestataire` et de le choisir ici : le reste de l'application ne change pas.
 */
export interface InstructionsPaiement {
  moyen: ModePaiement
  /** Numéro marchand à créditer, null pour un paiement en espèces. */
  numero: string | null
  montant: number
  /** Le serveur confirme la réception : aucun paiement n'est validé par le téléphone du client (§6). */
  confirmeParLeServeur: true
}

export interface Prestataire {
  readonly nom: string
  instructions: (restaurantId: number, moyen: ModePaiement, montant: number) => Promise<InstructionsPaiement>
}

/** Numéro marchand à créditer selon l'opérateur choisi. Les espèces n'en ont pas. */
export async function numeroMarchand(restaurantId: number, moyen: ModePaiement): Promise<string | null> {
  if (moyen !== 'ORANGE_MONEY' && moyen !== 'MTN_MOMO') return null
  const restaurant = await prisma.restaurant.findUniqueOrThrow({
    where: { id: restaurantId },
    select: { numeroOrangeMoney: true, numeroMtnMomo: true },
  })
  return moyen === 'ORANGE_MONEY' ? restaurant.numeroOrangeMoney : restaurant.numeroMtnMomo
}

export const paiementConstateParLeServeur: Prestataire = {
  nom: 'serveur',
  instructions: async (restaurantId, moyen, montant) => {
    const numero = await numeroMarchand(restaurantId, moyen)
    if (numero === null && moyen !== 'ESPECES') {
      throw new ConflictError("Ce moyen de paiement n'est pas encore configuré. Demandez au serveur.")
    }
    return { moyen, numero, montant, confirmeParLeServeur: true }
  },
}

/** Prestataire en service. Un seul pour l'instant : le paiement est reçu en main propre par le serveur. */
export const prestataire: Prestataire = paiementConstateParLeServeur
