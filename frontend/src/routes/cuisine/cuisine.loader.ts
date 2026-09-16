import type { LoaderFunctionArgs } from 'react-router'
import { chargerEcranPersonnel } from '@/lib/ecranPersonnel'
import { requeteStaff } from '@/lib/session'
import type { CommandeCuisine } from '@/types/cuisine'

export function chargerCuisine({ request }: LoaderFunctionArgs) {
  return chargerEcranPersonnel(request, 'cuisine', ['CUISINE', 'BAR', 'ADMIN'], async () =>
    (await requeteStaff<{ commandes: CommandeCuisine[] }>(request, '/cuisine/commandes')).commandes)
}
