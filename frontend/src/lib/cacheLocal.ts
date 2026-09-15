/**
 * Cache local de l'appareil, dans IndexedDB (CLAUDE.md §7) : le menu du client, les écrans cuisine et serveur.
 * Une erreur (navigation privée, stockage plein, navigateur ancien) est journalisée et vaut un cache vide :
 * l'application fonctionne alors comme sans cache, en lisant le réseau.
 */
const BASE = 'reserve-market'
const MAGASIN = 'cache'

export interface EntreeCache<T> {
  valeur: T
  /** Date.now() au moment de l'enregistrement. */
  enregistreLe: number
}

/** Données du personnel, effacées à la déconnexion : un autre compte ne les verra jamais sur cet appareil. */
export const CLES_PERSONNEL = ['cuisine', 'salle', 'menu-serveur'] as const
export type ClePersonnel = (typeof CLES_PERSONNEL)[number]

let ouverture: Promise<IDBDatabase> | null = null

function ouvrir(): Promise<IDBDatabase> {
  ouverture ??= new Promise((resoudre, rejeter) => {
    const requete = indexedDB.open(BASE, 1)
    requete.onupgradeneeded = () => requete.result.createObjectStore(MAGASIN)
    requete.onsuccess = () => resoudre(requete.result)
    requete.onerror = () => rejeter(requete.error ?? new Error('IndexedDB indisponible'))
  })
  return ouverture
}

async function operation<T>(mode: IDBTransactionMode, appel: (magasin: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const base = await ouvrir()
  return new Promise((resoudre, rejeter) => {
    const requete = appel(base.transaction(MAGASIN, mode).objectStore(MAGASIN))
    requete.onsuccess = () => resoudre(requete.result)
    requete.onerror = () => rejeter(requete.error ?? new Error('Opération IndexedDB échouée'))
  })
}

export async function lireCache<T>(cle: string): Promise<EntreeCache<T> | null> {
  try {
    const entree = await operation('readonly', (magasin) => magasin.get(cle) as IDBRequest<EntreeCache<T> | undefined>)
    return entree ?? null
  } catch (probleme) {
    console.warn('Cache local illisible', probleme)
    return null
  }
}

export async function ecrireCache<T>(cle: string, valeur: T): Promise<void> {
  const entree: EntreeCache<T> = { valeur, enregistreLe: Date.now() }
  try {
    await operation('readwrite', (magasin) => magasin.put(entree, cle))
  } catch (probleme) {
    console.warn('Cache local non enregistré', probleme)
  }
}

export async function effacerCache(cle: string): Promise<void> {
  try {
    await operation('readwrite', (magasin) => magasin.delete(cle))
  } catch (probleme) {
    console.warn('Cache local non effacé', probleme)
  }
}
