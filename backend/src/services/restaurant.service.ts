import { prisma } from '../lib/prisma.js'
import type { ReglagesPaiement } from '../schemas/restaurant.schema.js'

const selectReglages = { nom: true, telephone: true, adresse: true, numeroOrangeMoney: true, numeroMtnMomo: true } as const

export const obtenirReglages = (restaurantId: number) =>
  prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: selectReglages })

export const modifierReglagesPaiement = (restaurantId: number, donnees: ReglagesPaiement) =>
  prisma.restaurant.update({ where: { id: restaurantId }, data: donnees, select: selectReglages })
