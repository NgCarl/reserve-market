import type { Server as HttpServer } from 'node:http'
import { Server, type DefaultEventsMap } from 'socket.io'
import type { Role } from '../generated/prisma/client.js'
import { AppError, UnauthorizedError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import { NOM_COOKIE_SESSION } from '../lib/session.js'
import { utilisateurDepuisJeton } from '../services/auth.service.js'
import type { AppelSalle } from '../services/appel.service.js'
import type { CommandeCuisine, CommandePublique } from '../services/commande.format.js'

// Temps réel (CLAUDE.md §9). Typage des événements : https://socket.io/docs/v4/typescript/

type AvecCommande = (commande: CommandeCuisine | CommandePublique) => void

/** Le personnel reçoit le format cuisine, la table le format public de ses propres commandes. */
interface EvenementsServeur {
  'commande:nouvelle': AvecCommande
  'commande:statut': AvecCommande
  'commande:annulee': AvecCommande
  /** Salle des serveurs uniquement : un client appelle, ou demande l'addition (mode et montant). */
  'table:appel-serveur': (appel: AppelSalle) => void
  'table:addition': (appel: AppelSalle) => void
  /** Un serveur a pris l'appel en charge : il disparaît chez les autres. */
  'appel:traite': (appel: { id: number }) => void
}

export type EvenementCommande = 'commande:nouvelle' | 'commande:statut' | 'commande:annulee'

type DonneesSocket =
  | { type: 'table'; restaurantId: number; tableId: number }
  | { type: 'personnel'; restaurantId: number; utilisateurId: number; role: Role }

type ServeurTempsReel = Server<DefaultEventsMap, EvenementsServeur, DefaultEventsMap, DonneesSocket>

export const salles = {
  cuisine: (restaurantId: number) => `room:restaurant:${restaurantId}:cuisine`,
  bar: (restaurantId: number) => `room:restaurant:${restaurantId}:bar`,
  serveur: (restaurantId: number) => `room:restaurant:${restaurantId}:serveur`,
  table: (restaurantId: number, tableId: number) => `room:restaurant:${restaurantId}:table:${tableId}`,
}

const JETON_TABLE = /^[A-Za-z0-9_-]{22}$/

let io: ServeurTempsReel | null = null

/** Le handshake n'a pas de req.cookies : on lit l'en-tête Cookie envoyé par le navigateur (même origine). */
function lireCookie(entete: string | undefined, nom: string): string | undefined {
  for (const morceau of entete?.split(';') ?? []) {
    const [cle, ...valeur] = morceau.trim().split('=')
    if (cle !== nom) continue
    try {
      return decodeURIComponent(valeur.join('='))
    } catch {
      return undefined
    }
  }
  return undefined
}

/** Authentification au handshake, jamais après (§9) : le client avec le jeton de sa table, le personnel avec son cookie de session. */
async function identifier(auth: Record<string, unknown>, cookies: string | undefined): Promise<DonneesSocket> {
  if (auth.jetonTable !== undefined) {
    if (typeof auth.jetonTable !== 'string' || !JETON_TABLE.test(auth.jetonTable)) throw new UnauthorizedError('QR code invalide')
    const table = await prisma.table.findFirst({
      where: { jeton: auth.jetonTable, actif: true },
      select: { id: true, restaurantId: true },
    })
    if (!table) throw new UnauthorizedError('Table introuvable : scannez à nouveau le QR code')
    return { type: 'table', restaurantId: table.restaurantId, tableId: table.id }
  }

  const jeton = lireCookie(cookies, NOM_COOKIE_SESSION)
  if (!jeton) throw new UnauthorizedError()
  // Même vérification que les routes : compte actif et rôle relus en base.
  const utilisateur = await utilisateurDepuisJeton(jeton)
  return { type: 'personnel', restaurantId: utilisateur.restaurantId, utilisateurId: utilisateur.id, role: utilisateur.role }
}

export function demarrerTempsReel(serveurHttp: HttpServer): void {
  // Même serveur et même origine que l'API : pas d'option CORS. Le client vient du paquet npm, inutile de le servir.
  io = new Server<DefaultEventsMap, EvenementsServeur, DefaultEventsMap, DonneesSocket>(serveurHttp, { serveClient: false })

  // https://socket.io/docs/v4/middlewares/ : une erreur passée à next() refuse la connexion (connect_error côté client).
  io.use((socket, next) => {
    identifier(socket.handshake.auth, socket.handshake.headers.cookie).then(
      (donnees) => {
        socket.data = donnees
        next()
      },
      (error: unknown) => {
        if (error instanceof AppError) {
          next(new Error(error.message))
          return
        }
        console.error(error)
        next(new Error('Connexion temps réel impossible'))
      },
    )
  })

  io.on('connection', (socket) => {
    const donnees = socket.data
    if (donnees.type === 'table') {
      void socket.join(salles.table(donnees.restaurantId, donnees.tableId))
      return
    }
    // L'admin voit tout : les deux files de préparation comme le téléphone du serveur.
    if (donnees.role === 'ADMIN' || donnees.role === 'CUISINE') void socket.join(salles.cuisine(donnees.restaurantId))
    if (donnees.role === 'ADMIN' || donnees.role === 'BAR') void socket.join(salles.bar(donnees.restaurantId))
    if (donnees.role === 'ADMIN' || donnees.role === 'SERVEUR') void socket.join(salles.serveur(donnees.restaurantId))
  })
}

/** null hors du serveur HTTP (seed, scripts) : la diffusion est alors ignorée. */
export function tempsReel(): ServeurTempsReel | null {
  return io
}

/** Déconnecte les sockets puis ferme le serveur HTTP auquel Socket.io est attaché. */
export async function arreterTempsReel(): Promise<void> {
  if (io) await io.close()
}
