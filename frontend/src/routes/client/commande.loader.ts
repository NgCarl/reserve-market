import type { LoaderFunctionArgs } from 'react-router'
import { requeteApi } from '@/lib/api'
import type { CommandeSuivie } from '@/types/commande'

export function chargerCommande({ params }: LoaderFunctionArgs): Promise<{ commande: CommandeSuivie }> {
  const jeton = encodeURIComponent(params.jeton ?? '')
  const commandeId = encodeURIComponent(params.commandeId ?? '')
  return requeteApi<{ commande: CommandeSuivie }>(`/menu/${jeton}/commandes/${commandeId}`)
}
