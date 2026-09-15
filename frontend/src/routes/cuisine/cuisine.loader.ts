import type { LoaderFunctionArgs } from 'react-router'
import { requeteApi } from '@/lib/api'
import { exigerSession } from '@/lib/session'
import type { CommandeCuisine } from '@/types/cuisine'

export async function chargerCuisine({ request }: LoaderFunctionArgs) {
  const utilisateur = await exigerSession(request, ['CUISINE', 'ADMIN'])
  const { commandes } = await requeteApi<{ commandes: CommandeCuisine[] }>('/cuisine/commandes')
  return { utilisateur, commandes }
}
