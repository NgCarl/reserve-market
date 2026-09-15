import { useState } from 'react'
import { useSearchParams } from 'react-router'
import logo from '@/assets/logo-reserve-market.webp'
import { FormulaireConnexion } from '@/components/connexion/FormulaireConnexion'
import { FormulaireInscription } from '@/components/connexion/FormulaireInscription'
import { cn } from '@/lib/utils'

type Mode = 'connexion' | 'inscription'

const ONGLETS: { mode: Mode; libelle: string }[] = [
  { mode: 'connexion', libelle: 'Connexion' },
  { mode: 'inscription', libelle: 'Inscription' },
]

/** Espace du personnel (maquette FoodScan « Welcome Back ») : connexion, ou demande d'accès à faire valider par l'admin. */
export function ConnexionPage() {
  const [parametres] = useSearchParams()
  const [mode, setMode] = useState<Mode>(parametres.get('mode') === 'inscription' ? 'inscription' : 'connexion')
  const [emailInscrit, setEmailInscrit] = useState('')

  return (
    <main className="flex min-h-dvh flex-col items-center bg-white px-4 pt-8 pb-10 sm:pt-14">
      <div className="flex w-full max-w-[380px] flex-col gap-5 rounded-2xl bg-white p-6 shadow-[0_0_40px_rgba(3,40,66,0.09)]">
        <img src={logo} alt="Réserve Market" width={118} height={48} className="mx-auto h-12 w-auto" />

        <div role="tablist" aria-label="Espace du personnel" className="grid grid-cols-2 rounded-full bg-tuile p-1">
          {ONGLETS.map((onglet) => (
            <button
              key={onglet.mode}
              type="button"
              role="tab"
              aria-selected={mode === onglet.mode}
              onClick={() => setMode(onglet.mode)}
              className={cn(
                'h-10 rounded-full text-[15px] font-semibold transition-colors',
                mode === onglet.mode ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground',
              )}
            >
              {onglet.libelle}
            </button>
          ))}
        </div>

        {mode === 'connexion' ? (
          // key : le champ email est prérempli avec l'adresse qui vient de s'inscrire.
          <FormulaireConnexion key={emailInscrit} emailInitial={emailInscrit} />
        ) : (
          <FormulaireInscription
            onAllerConnexion={(email) => {
              setEmailInscrit(email)
              setMode('connexion')
            }}
          />
        )}
      </div>

      <p className="mt-6 max-w-[380px] text-center text-sm text-muted-foreground">
        Espace réservé au personnel du restaurant. Les clients commandent sans compte, en scannant le QR code de leur table.
      </p>
    </main>
  )
}
