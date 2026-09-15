import type { LoaderFunctionArgs } from 'react-router'
import { exigerSession, requeteStaff } from '@/lib/session'
import type { RestaurantInfos, TableAdmin } from '@/types/table'
import type { Personnel } from '@/types/utilisateur'

/** Route parente /admin : réservée aux admins, l'utilisateur est partagé par toutes les pages (useAdmin). */
export async function chargerAdmin({ request }: LoaderFunctionArgs) {
  return { utilisateur: await exigerSession(request, ['ADMIN']) }
}

export async function chargerPersonnel({ request }: LoaderFunctionArgs) {
  const { utilisateurs } = await requeteStaff<{ utilisateurs: Personnel[] }>(request, '/utilisateurs')
  return { personnel: utilisateurs }
}

export function chargerTables({ request }: LoaderFunctionArgs) {
  return requeteStaff<{ restaurant: RestaurantInfos; tables: TableAdmin[] }>(request, '/tables')
}

export function chargerTable({ request, params }: LoaderFunctionArgs) {
  return requeteStaff<{ restaurant: RestaurantInfos; table: TableAdmin }>(request, `/tables/${encodeURIComponent(params.tableId ?? '')}`)
}
