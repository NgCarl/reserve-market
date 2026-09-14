import { useRouteLoaderData } from 'react-router'
import type { chargerMenu } from '@/routes/client/menu.loader'

/** Menu de la table, chargé une fois par la route parente /menu/:jeton et partagé par ses pages. */
export function useMenu() {
  const menu = useRouteLoaderData<typeof chargerMenu>('menu')
  if (!menu) throw new Error('useMenu doit être utilisé sous la route /menu/:jeton')
  return menu
}
