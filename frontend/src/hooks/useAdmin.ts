import { useRouteLoaderData } from 'react-router'
import type { chargerAdmin } from '@/routes/admin/admin.loader'

/** Admin connecté, chargé une fois par la route parente /admin. */
export function useAdmin() {
  const donnees = useRouteLoaderData<typeof chargerAdmin>('admin')
  if (!donnees) throw new Error('useAdmin doit être utilisé sous la route /admin')
  return donnees.utilisateur
}
