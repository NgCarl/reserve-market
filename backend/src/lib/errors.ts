/** Erreur métier traduite en réponse HTTP par le middleware errorHandler. */
export class AppError extends Error {
  readonly statusCode: number
  readonly details: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
    this.details = details
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Données invalides', details?: unknown) {
    super(400, message, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentification requise') {
    super(401, message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès refusé') {
    super(403, message)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource introuvable') {
    super(404, message)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message)
  }
}

export class TooManyRequestsError extends AppError {
  readonly retryAfterSeconds: number

  constructor(message: string, retryAfterSeconds: number) {
    super(429, message)
    this.retryAfterSeconds = retryAfterSeconds
  }
}
