import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { classeChamp } from '@/lib/formulaire'

interface Props {
  id: string
  valeur: string
  onChange: (valeur: string) => void
  autoComplete: 'current-password' | 'new-password'
  decritPar?: string
}

/** Mot de passe avec bouton afficher/masquer : sur téléphone, les fautes de frappe sont fréquentes. */
export function ChampMotDePasse({ id, valeur, onChange, autoComplete, decritPar }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        aria-describedby={decritPar}
        className={`${classeChamp} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((etat) => !etat)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-tuile"
      >
        {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  )
}
