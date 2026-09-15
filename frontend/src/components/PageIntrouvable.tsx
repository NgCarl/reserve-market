import { Link } from 'react-router'

export function PageIntrouvable() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold text-marque-nuit">Réserve Market</h1>
      <p className="text-muted-foreground">Scannez le QR code posé sur votre table pour voir le menu.</p>
      <Link to="/connexion" className="mt-2 text-sm font-semibold text-primary">
        Espace du personnel
      </Link>
    </main>
  )
}
