import type { LoaderFunctionArgs } from 'react-router'
import { ErreurApi, requeteApi } from '@/lib/api'
import { effacerCache, ecrireCache, lireCache } from '@/lib/cacheLocal'
import { menusRafraichis } from '@/lib/menuFrais'
import { router } from '@/router'
import { usePanier } from '@/stores/panier'
import type { MenuTable } from '@/types/menu'

const CLE = 'menu'

/** Un seul menu gardé sur le téléphone : celui de la dernière table scannée. */
interface MenuEnregistre {
  jeton: string
  menu: MenuTable
}

const telecharger = (jeton: string) => requeteApi<MenuTable>(`/menu/${encodeURIComponent(jeton)}`)

/**
 * Charge le menu avant d'afficher la page (CLAUDE.md §7, §8).
 * - Premier scan : téléchargement, puis enregistrement sur le téléphone.
 * - Scans suivants de la même table : le menu enregistré s'affiche tout de suite, même sans réseau. La version à jour
 *   est lue en arrière-plan et remplace l'affichage si la carte a changé (prix, plats épuisés).
 * Sans menu enregistré, une erreur affiche l'ErrorBoundary de la route. Les prix restent recalculés par le serveur.
 */
export async function chargerMenu({ params }: LoaderFunctionArgs): Promise<MenuTable> {
  const jeton = params.jeton ?? ''
  // Relecture demandée par rafraichirEnArrierePlan : le cache vient d'être mis à jour, inutile de retélécharger.
  const relecture = menusRafraichis.delete(jeton)
  const enregistre = (await lireCache<MenuEnregistre>(CLE))?.valeur
  let menu: MenuTable
  if (enregistre?.jeton === jeton) {
    menu = enregistre.menu
    if (!relecture) void rafraichirEnArrierePlan(jeton, menu)
  } else {
    menu = await telecharger(jeton)
    void ecrireCache<MenuEnregistre>(CLE, { jeton, menu })
  }
  // La table existe : le panier lui est rattaché (vidé si le client vient d'une autre table).
  usePanier.getState().ouvrirPourTable(jeton)
  return menu
}

async function rafraichirEnArrierePlan(jeton: string, affiche: MenuTable): Promise<void> {
  let menu: MenuTable
  try {
    menu = await telecharger(jeton)
  } catch (probleme) {
    // QR plus valable : jeton inconnu (404, table supprimée ou jeton régénéré) ou mal formé (400).
    if (probleme instanceof ErreurApi && (probleme.status === 404 || probleme.status === 400)) {
      // On oublie le menu : la relecture affiche l'erreur.
      await effacerCache(CLE)
      menusRafraichis.add(jeton)
      await router.revalidate()
    } else if (!(probleme instanceof ErreurApi && probleme.status === 0)) {
      console.warn('Menu non rafraîchi', probleme)
    }
    // Sans réseau : le menu enregistré reste affiché.
    return
  }
  if (JSON.stringify(menu) === JSON.stringify(affiche)) return
  await ecrireCache<MenuEnregistre>(CLE, { jeton, menu })
  menusRafraichis.add(jeton)
  await router.revalidate()
}
