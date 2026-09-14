import type { LoaderFunctionArgs } from 'react-router'
import { requeteApi } from '@/lib/api'
import { usePanier } from '@/stores/panier'
import type { MenuTable } from '@/types/menu'

/** Charge le menu avant d'afficher la page. En cas d'erreur, React Router affiche l'ErrorBoundary de la route. */
export async function chargerMenu({ params }: LoaderFunctionArgs): Promise<MenuTable> {
  const jeton = params.jeton ?? ''
  const menu = await requeteApi<MenuTable>(`/menu/${encodeURIComponent(jeton)}`)
  // La table existe : le panier lui est rattaché (vidé si le client vient d'une autre table).
  usePanier.getState().ouvrirPourTable(jeton)
  return menu
}
