import type { LoaderFunctionArgs } from 'react-router'
import { chargerEcranPersonnel } from '@/lib/ecranPersonnel'
import { requeteStaff } from '@/lib/session'
import type { EtatSalle, MenuServeur } from '@/types/salle'

export function chargerServeur({ request }: LoaderFunctionArgs) {
  return chargerEcranPersonnel(request, 'salle', ['SERVEUR', 'ADMIN'], () => requeteStaff<EtatSalle>(request, '/serveur/salle'))
}

export function chargerSaisie({ request }: LoaderFunctionArgs) {
  return chargerEcranPersonnel(request, 'menu-serveur', ['SERVEUR', 'ADMIN'], () => requeteStaff<MenuServeur>(request, '/serveur/menu'))
}
