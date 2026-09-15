import type { StatutCommande } from '@/types/commande'

export const LIBELLES_STATUT: Record<StatutCommande, string> = {
  RECUE: 'Reçue',
  EN_PREPARATION: 'En préparation',
  PRETE: 'Prête',
  SERVIE: 'Servie',
  ANNULEE: 'Annulée',
}

/** Pastilles de statut côté client (fond clair, texte contrasté). */
export const COULEURS_STATUT: Record<StatutCommande, string> = {
  RECUE: 'bg-primary/10 text-primary',
  EN_PREPARATION: 'bg-amber-100 text-amber-900',
  PRETE: 'bg-emerald-100 text-emerald-800',
  SERVIE: 'bg-tuile text-marque-nuit',
  ANNULEE: 'bg-red-100 text-red-700',
}
