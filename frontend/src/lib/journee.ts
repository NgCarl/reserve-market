// Dates et heures à l'heure du restaurant (Douala, UTC+1), quel que soit le fuseau de l'appareil de l'admin.
// Miroir de backend/src/lib/journee.ts.

export const FUSEAU_RESTAURANT = 'Africa/Douala'

const formatJour = new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU_RESTAURANT, year: 'numeric', month: '2-digit', day: '2-digit' })
const formatDateLongue = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU_RESTAURANT, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const formatHeureSeule = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU_RESTAURANT, hour: 'numeric', hourCycle: 'h23' })

/** « 19:42 » à l'heure du restaurant. */
export const heureRestaurant = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU_RESTAURANT, hour: '2-digit', minute: '2-digit' })

/** Date du restaurant au format AAAA-MM-JJ. */
export const jourRestaurant = (instant: Date = new Date()): string => formatJour.format(instant)

/** « mardi 15 septembre 2026 ». Midi, heure de Douala : aucun décalage de jour possible à l'affichage. */
export const dateLongue = (jour: string): string => formatDateLongue.format(new Date(`${jour}T12:00:00+01:00`))

/** Heure pleine (0 à 23) au restaurant, pour dire bonjour ou bonsoir. */
export const heureActuelleRestaurant = (): number => Number(formatHeureSeule.format(new Date()))
