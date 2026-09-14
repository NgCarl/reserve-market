/** Même silhouette que le squelette de index.html : la transition vers la page est invisible. */
export function SqueletteMenu() {
  return (
    <div aria-busy="true" aria-label="Chargement du menu">
      <div className="h-16 border-b border-border bg-white" />
      <div className="grid gap-3 p-4">
        <div className="h-12 animate-pulse rounded-full bg-tuile" />
        <div className="h-10 w-3/4 animate-pulse rounded-full bg-tuile" />
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-31 animate-pulse rounded-2xl bg-tuile" />
        ))}
      </div>
    </div>
  )
}
