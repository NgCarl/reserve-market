import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import logo from '@/assets/logo-reserve-market.webp'
import { FormulaireConnexion } from '@/components/connexion/FormulaireConnexion'
import { FormulaireInscription } from '@/components/connexion/FormulaireInscription'
import { ErreurApi, requeteApi } from '@/lib/api'
import { LIBELLES_ROLE } from '@/lib/roles'
import { accueilDuRole } from '@/lib/session'
import { cn } from '@/lib/utils'
import type { Utilisateur } from '@/types/utilisateur'

type Mode = 'connexion' | 'inscription'

const ONGLETS: { mode: Mode; libelle: string }[] = [
  { mode: 'connexion', libelle: 'Connexion' },
  { mode: 'inscription', libelle: 'Inscription' },
]

/**
 * Porte d'entrée du personnel, ouverte au lancement du site (`/` y redirige) : chacun se connecte selon son rôle,
 * les nouveaux membres s'inscrivent. Maquette FoodScan « Welcome Back ».
 */
export function ConnexionPage() {
  const [parametres] = useSearchParams()
  const [mode, setMode] = useState<Mode>(parametres.get('mode') === 'inscription' ? 'inscription' : 'connexion')
  const [emailInscrit, setEmailInscrit] = useState('')
  const [dejaConnecte, setDejaConnecte] = useState<Utilisateur | null>(null)
  const sessionExpiree = parametres.get('expiree') === '1'

  useEffect(() => {
    let actif = true
    // Session encore ouverte : raccourci vers son espace. Le formulaire reste là pour changer de compte.
    requeteApi<{ utilisateur: Utilisateur }>('/auth/check-auth').then(
      ({ utilisateur }) => {
        if (actif) setDejaConnecte(utilisateur)
      },
      (probleme: unknown) => {
        // 401 : personne n'est connecté, c'est le cas normal.
        if (!(probleme instanceof ErreurApi && probleme.status === 401)) console.error(probleme)
      },
    )
    return () => {
      actif = false
    }
  }, [])

  return (
    <main className="flex min-h-dvh flex-col items-center bg-white px-4 pt-8 pb-10 sm:pt-14">
      <div className="flex w-full max-w-[380px] flex-col gap-5 rounded-2xl bg-white p-6 shadow-[0_0_40px_rgba(3,40,66,0.09)]">
        <img src={logo} alt="Réserve Market" width={118} height={48} className="mx-auto h-12 w-auto" />

        {sessionExpiree && !dejaConnecte && (
          <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Session fermée après 30 minutes d'inactivité. Reconnectez-vous pour continuer.
          </p>
        )}

        {dejaConnecte && (
          <div className="flex flex-col gap-3 rounded-xl bg-primary/5 p-4 text-sm">
            <p className="text-marque-nuit">
              Vous êtes connecté en tant que <strong>{dejaConnecte.nom}</strong>
              {dejaConnecte.nom !== LIBELLES_ROLE[dejaConnecte.role] && ` (${LIBELLES_ROLE[dejaConnecte.role]})`}.
            </p>
            <Link
              to={accueilDuRole(dejaConnecte.role)}
              className="flex h-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
            >
              Ouvrir mon espace
            </Link>
          </div>
        )}

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
