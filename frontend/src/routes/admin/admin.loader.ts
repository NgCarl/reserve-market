import type { LoaderFunctionArgs } from 'react-router'
import { exigerSession, requeteStaff } from '@/lib/session'
import type { CategorieAdmin, PlatAdmin } from '@/types/carte'
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

export function chargerCategories({ request }: LoaderFunctionArgs) {
  return requeteStaff<{ categories: CategorieAdmin[] }>(request, '/categories')
}

export async function chargerPlats({ request }: LoaderFunctionArgs) {
  const [{ plats }, { categories }] = await Promise.all([
    requeteStaff<{ plats: PlatAdmin[] }>(request, '/plats'),
    requeteStaff<{ categories: CategorieAdmin[] }>(request, '/categories'),
  ])
  return { plats, categories }
}

/** Fiche d'un plat ; « nouveau » ouvre le formulaire de création. La liste des plats sert aux compléments. */
export async function chargerPlat({ request, params }: LoaderFunctionArgs) {
  const [plat, { plats }, { categories }] = await Promise.all([
    params.platId === 'nouveau'
      ? Promise.resolve(null)
      : requeteStaff<{ plat: PlatAdmin }>(request, `/plats/${encodeURIComponent(params.platId ?? '')}`).then((reponse) => reponse.plat),
    requeteStaff<{ plats: PlatAdmin[] }>(request, '/plats'),
    requeteStaff<{ categories: CategorieAdmin[] }>(request, '/categories'),
  ])
  return { plat, plats, categories }
}

export function chargerTable({ request, params }: LoaderFunctionArgs) {
  return requeteStaff<{ restaurant: RestaurantInfos; table: TableAdmin }>(request, `/tables/${encodeURIComponent(params.tableId ?? '')}`)
}
