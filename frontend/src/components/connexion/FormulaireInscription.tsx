import { Check, ChefHat, ConciergeBell } from 'lucide-react'
import { useState } from 'react'
import { messageErreur, requeteApi } from '@/lib/api'
import { classeChamp, REGLES_MOT_DE_PASSE } from '@/lib/formulaire'
import { cn } from '@/lib/utils'
import { ChampMotDePasse } from './ChampMotDePasse'

type Poste = 'CUISINE' | 'SERVEUR'

// Jamais « Administrateur » : ce rôle ne s'attribue que depuis le back-office.
const POSTES: { valeur: Poste; libelle: string; Icone: typeof ChefHat }[] = [
  { valeur: 'CUISINE', libelle: 'Cuisine ou bar', Icone: ChefHat },
  { valeur: 'SERVEUR', libelle: 'Serveur', Icone: ConciergeBell },
]

interface Props {
  onAllerConnexion: (email: string) => void
}

/** Demande d'accès du personnel. Le compte reste inactif jusqu'à son activation par l'administrateur. */
export function FormulaireInscription({ onAllerConnexion }: Props) {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [poste, setPoste] = useState<Poste | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoyee, setEnvoyee] = useState(false)

  const motDePasseValide = REGLES_MOT_DE_PASSE.every((regle) => regle.respectee(motDePasse))
  const complet = nom.trim() !== '' && email.trim() !== '' && motDePasseValide && poste !== null

  const inscrire = async () => {
    if (!complet || enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      await requeteApi<{ message: string }>('/auth/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, motDePasse, role: poste }),
      })
      setEnvoyee(true)
    } catch (probleme) {
      setErreur(messageErreur(probleme, "L'inscription n'a pas abouti. Réessayez."))
    } finally {
      setEnCours(false)
    }
  }

  if (envoyee) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center" role="status">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="size-8" strokeWidth={3} />
        </span>
        <h1 className="text-2xl font-bold text-marque-nuit">Demande envoyée</h1>
        <p className="text-muted-foreground">
          L'administrateur du restaurant doit activer votre compte. Vous pourrez ensuite vous connecter avec {email.trim().toLowerCase()}.
        </p>
        <button
          type="button"
          onClick={() => onAllerConnexion(email.trim())}
          className="h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground"
        >
          Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(evenement) => {
        evenement.preventDefault()
        void inscrire()
      }}
      className="flex flex-col gap-5"
    >
      <h1 className="text-center text-2xl font-bold text-marque-nuit">Rejoindre l'équipe</h1>

      {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{erreur}</p>}

      <div className="flex flex-col gap-2">
        <label htmlFor="inscription-nom" className="text-sm font-medium text-marque-nuit">Nom complet</label>
        <input
          id="inscription-nom"
          autoComplete="name"
          maxLength={100}
          required
          value={nom}
          onChange={(evenement) => setNom(evenement.target.value)}
          className={classeChamp}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="inscription-email" className="text-sm font-medium text-marque-nuit">Email</label>
        <input
          id="inscription-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(evenement) => setEmail(evenement.target.value)}
          className={classeChamp}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="inscription-mot-de-passe" className="text-sm font-medium text-marque-nuit">Mot de passe</label>
        <ChampMotDePasse
          id="inscription-mot-de-passe"
          valeur={motDePasse}
          onChange={setMotDePasse}
          autoComplete="new-password"
          decritPar="regles-mot-de-passe"
        />
        <ul id="regles-mot-de-passe" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {REGLES_MOT_DE_PASSE.map(({ libelle, respectee }) => {
            const ok = respectee(motDePasse)
            return (
              <li key={libelle} className={cn('flex items-center gap-1', ok ? 'text-emerald-700' : 'text-muted-foreground')}>
                <Check className={cn('size-3.5', !ok && 'opacity-40')} strokeWidth={3} />
                {libelle}
              </li>
            )
          })}
        </ul>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-marque-nuit">Votre poste</legend>
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          {POSTES.map(({ valeur, libelle, Icone }) => (
            <button
              key={valeur}
              type="button"
              role="radio"
              aria-checked={poste === valeur}
              onClick={() => setPoste(valeur)}
              className={cn(
                'flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-[15px] font-semibold transition-colors',
                poste === valeur ? 'border-primary bg-primary/5 text-primary' : 'border-border text-marque-nuit',
              )}
            >
              <Icone className="size-6" />
              {libelle}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!complet || enCours}
        className="mt-1 h-12 rounded-full bg-primary text-base font-bold text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {enCours ? 'Envoi…' : 'Envoyer ma demande'}
      </button>
    </form>
  )
}
