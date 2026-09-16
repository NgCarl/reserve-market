import type { LoaderFunctionArgs } from 'react-router'
import { exigerSession, requeteStaff } from '@/lib/session'
import type { CategorieAdmin, PlatAdmin } from '@/types/carte'
import type { CommandeAdmin, CommandeResume, ReglagesRestaurant, TableauDeBord } from '@/types/gestion'
import type { RestaurantInfos, TableAdmin } from '@/types/table'
import type { Personnel } from '@/types/utilisateur'

/** Route parente /admin : réservée aux admins, l'utilisateur est partagé par toutes les pages (useAdmin). */
export async function chargerAdmin({ request }: LoaderFunctionArgs) {
  return { utilisateur: await exigerSession(request, ['ADMIN']) }
}

/** Reprend de l'URL de la page les filtres transmis à l'API (?date=, ?statut=, ?table=). */
function filtresDeLaPage(request: Request, noms: readonly string[]): string {
  const source = new URL(request.url).searchParams
  const filtres = new URLSearchParams()
  for (const nom of noms) {
    const valeur = source.get(nom)
    if (valeur) filtres.set(nom, valeur)
  }
  const chaine = filtres.toString()
  return chaine ? `?${chaine}` : ''
}

export function chargerTableauDeBord({ request }: LoaderFunctionArgs) {
  return requeteStaff<TableauDeBord>(request, `/gestion/tableau-de-bord${filtresDeLaPage(request, ['date'])}`)
}

export async function chargerCommandesJour({ request }: LoaderFunctionArgs) {
  const [liste, { tables }] = await Promise.all([
    requeteStaff<{ jour: string; commandes: CommandeResume[]; total: number }>(
      request,
      `/gestion/commandes${filtresDeLaPage(request, ['date', 'statut', 'table'])}`,
    ),
    requeteStaff<{ tables: TableAdmin[] }>(request, '/tables'),
  ])
  return { ...liste, tables }
}

export function chargerCommandeAdmin({ request, params }: LoaderFunctionArgs) {
  return requeteStaff<{ commande: CommandeAdmin }>(request, `/gestion/commandes/${encodeURIComponent(params.commandeId ?? '')}`)
}

export function chargerReglages({ request }: LoaderFunctionArgs) {
  return requeteStaff<{ restaurant: ReglagesRestaurant }>(request, '/gestion/restaurant')
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
