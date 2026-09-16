import type { ModePaiement } from '@/types/gestion'

/** Libellés affichés partout : suivi du client, téléphone du serveur, back-office. */
export const LIBELLES_PAIEMENT: Record<ModePaiement, string> = {
  ESPECES: 'Espèces',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN MoMo',
  CARTE: 'Carte bancaire',
}

/** Numéro lisible et facile à recopier : 699 12 34 56. Les numéros sont enregistrés sans indicatif ni espace. */
export const formaterNumero = (numero: string): string =>
  numero.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4')

/** Paiements encaissés en main propre par le serveur (§6). La carte attend un prestataire (§4). */
export const MOYENS_SERVEUR = ['ESPECES', 'ORANGE_MONEY', 'MTN_MOMO'] as const satisfies readonly ModePaiement[]
