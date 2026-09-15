import { randomBytes } from 'node:crypto'

/** Jeton d'accès encodé dans le QR d'une table : 128 bits d'aléa en base64url, impossible à deviner (CLAUDE.md §6). */
export const genererJetonTable = (): string => randomBytes(16).toString('base64url')
