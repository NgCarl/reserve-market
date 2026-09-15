// Journée de service à l'heure du restaurant, et non à celle du serveur : Render tourne en UTC.
// Douala est à l'heure d'Afrique de l'Ouest (UTC+1), sans heure d'été : le décalage est fixe.

export const FUSEAU_RESTAURANT = 'Africa/Douala'
const DECALAGE_RESTAURANT = '+01:00'
const JOUR_MS = 24 * 60 * 60 * 1000

const formatJour = new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU_RESTAURANT, year: 'numeric', month: '2-digit', day: '2-digit' })

/** Date locale du restaurant au format AAAA-MM-JJ. */
export const jourRestaurant = (instant: Date): string => formatJour.format(instant)

/** Bornes [debut, fin[ d'une journée, de minuit à minuit heure de Douala. Sans jour précisé : aujourd'hui. */
export function bornesJournee(jour: string = jourRestaurant(new Date())): { jour: string; debut: Date; fin: Date } {
  const debut = new Date(`${jour}T00:00:00${DECALAGE_RESTAURANT}`)
  return { jour, debut, fin: new Date(debut.getTime() + JOUR_MS) }
}
