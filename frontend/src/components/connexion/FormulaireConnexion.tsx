import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { messageErreur, requeteApi } from '@/lib/api'
import { classeChamp } from '@/lib/formulaire'
import { accueilDuRole, retourSur } from '@/lib/session'
import type { Utilisateur } from '@/types/utilisateur'
import { ChampMotDePasse } from './ChampMotDePasse'

interface Props {
  emailInitial: string
}

export function FormulaireConnexion({ emailInitial }: Props) {
  const navigate = useNavigate()
  const [parametres] = useSearchParams()
  const [email, setEmail] = useState(emailInitial)
  const [motDePasse, setMotDePasse] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const connecter = async () => {
    if (enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      const { utilisateur } = await requeteApi<{ utilisateur: Utilisateur }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
      })
      await navigate(retourSur(parametres.get('retour')) ?? accueilDuRole(utilisateur.role), { replace: true })
    } catch (probleme) {
      // Identifiants faux, compte pas encore activé ou connexion suspendue : le serveur renvoie un message déjà rédigé.
      setErreur(messageErreur(probleme, 'Connexion impossible. Réessayez.'))
      setEnCours(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={(evenement) => {
        evenement.preventDefault()
        void connecter()
      }}
      className="flex flex-col gap-5"
    >
      <h1 className="text-center text-2xl font-bold text-marque-nuit">Bon retour</h1>

      {erreur && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{erreur}</p>}

      <div className="flex flex-col gap-2">
        <label htmlFor="connexion-email" className="text-sm font-medium text-marque-nuit">Email</label>
        <input
          id="connexion-email"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          value={email}
          onChange={(evenement) => setEmail(evenement.target.value)}
          className={classeChamp}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="connexion-mot-de-passe" className="text-sm font-medium text-marque-nuit">Mot de passe</label>
        <ChampMotDePasse id="connexion-mot-de-passe" valeur={motDePasse} onChange={setMotDePasse} autoComplete="current-password" />
      </div>

      <button
        type="submit"
        disabled={enCours || email === '' || motDePasse === ''}
        className="mt-1 h-12 rounded-full bg-primary text-base font-bold text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {enCours ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
