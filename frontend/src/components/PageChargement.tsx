import logo from '@/assets/logo-reserve-market.webp'

/** Premier chargement d'un écran du personnel : le logo, sans spinner plein écran. */
export function PageChargement() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f5f6fa] p-6" aria-busy="true">
      <img src={logo} alt="Réserve Market" width={118} height={48} className="h-12 w-auto animate-pulse" />
      <p className="text-sm text-muted-foreground">Chargement…</p>
    </main>
  )
}
