import type { LoaderFunctionArgs } from 'react-router'
import { requeteApi } from '@/lib/api'
import { exigerSession } from '@/lib/session'
import type { Personnel } from '@/types/utilisateur'

export async function chargerPersonnel({ request }: LoaderFunctionArgs) {
  const utilisateur = await exigerSession(request, ['ADMIN'])
  const { utilisateurs } = await requeteApi<{ utilisateurs: Personnel[] }>('/utilisateurs')
  return { utilisateur, personnel: utilisateurs }
}
