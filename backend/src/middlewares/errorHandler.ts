import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError, NotFoundError, TooManyRequestsError } from '../lib/errors.js'

export const apiNotFound: RequestHandler = (req) => {
  throw new NotFoundError(`Route inconnue : ${req.method} ${req.originalUrl}`)
}

// Erreurs levées par les middlewares d'Express (express.json, express.static) : elles portent un status HTTP.
interface ErreurHttp extends Error {
  status: number
  expose: boolean
  type?: string
}

const estErreurHttp = (error: unknown): error is ErreurHttp =>
  error instanceof Error && 'status' in error && typeof error.status === 'number' && 'expose' in error

/** Seul endroit qui transforme une erreur en réponse HTTP. */
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof AppError) {
    if (error instanceof TooManyRequestsError) res.set('Retry-After', String(error.retryAfterSeconds))
    const corps = error.details === undefined ? { message: error.message } : { message: error.message, details: error.details }
    res.status(error.statusCode).json(corps)
    return
  }

  if (estErreurHttp(error) && error.expose) {
    const message = error.type === 'entity.parse.failed' ? 'Corps de requête JSON invalide' : error.message
    res.status(error.status).json({ message })
    return
  }

  // Erreur inattendue : détail dans les logs serveur, jamais dans la réponse.
  console.error(error)
  res.status(500).json({ message: 'Erreur interne du serveur' })
}
