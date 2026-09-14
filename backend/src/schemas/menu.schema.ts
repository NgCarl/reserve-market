import { z } from 'zod'

// Jeton de table : 16 octets aléatoires encodés en base64url, soit 22 caractères.
export const jetonParamsSchema = z.object({
  jeton: z.string().regex(/^[A-Za-z0-9_-]{22}$/, { error: 'QR code invalide' }),
})
