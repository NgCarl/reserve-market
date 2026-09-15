import type { LoaderFunctionArgs } from 'react-router'
import { exigerSession } from '@/lib/session'

export async function chargerServeur({ request }: LoaderFunctionArgs) {
  return { utilisateur: await exigerSession(request, ['SERVEUR', 'ADMIN']) }
}
