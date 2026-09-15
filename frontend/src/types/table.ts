// Miroir de backend/src/services/table.service.ts.

export interface RestaurantInfos {
  nom: string
  telephone: string | null
  adresse: string | null
}

export interface TableAdmin {
  id: number
  numero: number
  nombreChaises: number
  /** Adresse encodée dans le QR code, jeton compris. */
  urlMenu: string
}
