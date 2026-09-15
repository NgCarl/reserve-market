// Carillon de l'écran cuisine (CLAUDE.md §10), généré avec Web Audio : aucun fichier son à télécharger.

let contexte: AudioContext | null = null

/** À appeler depuis un appui : tant que l'utilisateur n'a pas touché la page, le navigateur bloque le son. */
export async function deverrouillerSon(): Promise<void> {
  contexte ??= new AudioContext()
  await contexte.resume()
}

/** « Ding-dong » : deux notes courtes, audibles dans le bruit d'une cuisine. */
export function jouerCarillon(): void {
  if (contexte?.state !== 'running') return
  const debut = contexte.currentTime
  for (const [index, frequence] of [988, 740].entries()) {
    const oscillateur = contexte.createOscillator()
    const volume = contexte.createGain()
    const instant = debut + index * 0.28
    oscillateur.type = 'sine'
    oscillateur.frequency.value = frequence
    volume.gain.setValueAtTime(0.0001, instant)
    volume.gain.exponentialRampToValueAtTime(0.5, instant + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, instant + 0.7)
    oscillateur.connect(volume).connect(contexte.destination)
    oscillateur.start(instant)
    oscillateur.stop(instant + 0.75)
  }
}
