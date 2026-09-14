interface Props {
  titre: string
  etape: number
}

/** Écran d'un rôle pas encore construit (ordre de construction, CLAUDE.md §13). */
export function PageAVenir({ titre, etape }: Props) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">{titre}</h1>
      <p className="text-slate-600">Arrive à l'étape {etape}.</p>
    </main>
  )
}
