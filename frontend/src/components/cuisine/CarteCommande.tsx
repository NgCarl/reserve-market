import { ChefHat, ChevronDown, Flame, Wine, X } from 'lucide-react'
import { useState } from 'react'
import { minutesEcoulees, niveauAttente, type CarteTable, type LigneCarte, type NiveauAttente, type StatutCarte } from '@/lib/cuisine'
import { cn } from '@/lib/utils'

interface Props {
  carte: CarteTable
  maintenant: number
  occupee: boolean
  onStatut: (carte: CarteTable, statut: 'EN_PREPARATION' | 'PRETE', lignes: LigneCarte[]) => void
  onUrgent: (carte: CarteTable) => void
  onAnnuler: (ligne: LigneCarte, carte: CarteTable) => void
}

const BADGES: Record<StatutCarte, { libelle: string; classe: string }> = {
  RECUE: { libelle: 'Reçue', classe: 'bg-primary text-primary-foreground' },
  EN_PREPARATION: { libelle: 'En préparation', classe: 'bg-amber-500 text-white' },
  PRETE: { libelle: 'Prête', classe: 'bg-emerald-500 text-white' },
}

const ATTENTE: Record<NiveauAttente, { bordure: string; pastille: string }> = {
  normal: { bordure: 'border-l-emerald-500', pastille: 'bg-emerald-100 text-emerald-800' },
  attention: { bordure: 'border-l-amber-500', pastille: 'bg-amber-100 text-amber-900' },
  retard: { bordure: 'border-l-red-600', pastille: 'bg-red-100 text-red-700' },
}

const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Carte d'une table (maquette FoodScan « Dine-In Orders ») : en-tête, résumé, lignes dépliables et actions. */
export function CarteCommande({ carte, maintenant, occupee, onStatut, onUrgent, onAnnuler }: Props) {
  // Les cartes en cours s'ouvrent d'office : le cuisinier lit les plats sans toucher l'écran.
  const [ouverte, setOuverte] = useState(!carte.prete)
  const minutes = minutesEcoulees(carte.depuis, maintenant)
  const attente = ATTENTE[niveauAttente(minutes)]
  const badge = BADGES[carte.statut]
  const recues = carte.lignes.filter((ligne) => ligne.statut === 'RECUE')
  const places = [...new Set(carte.lignes.map((ligne) => ligne.chaise).filter((chaise) => chaise !== null))].sort((a, b) => a - b)
  const IconePoste = carte.poste === 'BAR' ? Wine : ChefHat

  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-white',
        !carte.prete && ['border-l-4', attente.bordure],
        carte.urgent && !carte.prete && 'ring-2 ring-red-500/60',
      )}
    >
      <div className={cn('flex items-center justify-between gap-2 px-3 py-2.5', carte.prete ? 'bg-emerald-50' : 'bg-primary/5')}>
        <h3 className="flex min-w-0 items-center gap-2 text-base font-medium text-primary">
          <IconePoste className="size-4 shrink-0" />
          Table {carte.table.numero}
          {carte.urgent && !carte.prete && (
            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white">URGENT</span>
          )}
        </h3>
        <span className={cn('shrink-0 rounded px-2 py-1 text-[11px] leading-none font-medium', badge.classe)}>{badge.libelle}</span>
      </div>

      <div className="relative px-3 py-3 text-[15px]">
        <p className="text-muted-foreground">
          Commande{carte.commandeIds.length > 1 ? 's' : ''} :{' '}
          <span className="text-marque-nuit">{carte.commandeIds.map((id) => `#${id}`).join(', ')}</span>
        </p>
        <p className="text-muted-foreground">
          Place{places.length > 1 ? 's' : ''} : <span className="text-marque-nuit">{places.length > 0 ? places.join(', ') : '—'}</span>
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          {carte.prete && carte.preteLe ? (
            <>Prête à {heure.format(new Date(carte.preteLe))} · en attente du serveur</>
          ) : (
            <>
              Envoyée à {heure.format(new Date(carte.depuis))}
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', attente.pastille)}>{minutes} min</span>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setOuverte((valeur) => !valeur)}
          aria-expanded={ouverte}
          aria-label={ouverte ? 'Replier la carte' : 'Déplier la carte'}
          className="absolute right-3 bottom-3 flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <ChevronDown className={cn('size-5 transition-transform', ouverte && 'rotate-180')} />
        </button>
      </div>

      {ouverte && (
        <div className="border-t border-border px-3 py-3">
          <ul className="flex flex-col gap-2.5">
            {carte.lignes.map((ligne) => (
              <li key={ligne.id} className="flex items-start gap-2.5">
                <span className="min-w-7 font-semibold text-marque-nuit">{ligne.quantite}x</span>
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-medium text-marque-nuit">
                    {ligne.nomPlat}
                    {ligne.chaise !== null && <span className="ml-1.5 text-xs font-normal text-muted-foreground">place {ligne.chaise}</span>}
                  </p>
                  {ligne.options.map((option) => (
                    <p key={option} className="text-xs text-marque-nuit/80">{option}</p>
                  ))}
                  {ligne.note && (
                    <p className="text-sm">
                      <span className="text-marque-nuit/80">Instruction :</span> <span className="font-semibold text-marque-nuit">{ligne.note}</span>
                    </p>
                  )}
                  {!carte.prete && carte.statut === 'EN_PREPARATION' && ligne.statut === 'RECUE' && (
                    <p className="text-xs font-semibold text-primary">Nouveau, pas encore commencé</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onAnnuler(ligne, carte)}
                  disabled={occupee}
                  aria-label={`Annuler ${ligne.nomPlat}`}
                  title="Annuler cet article"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>

          {!carte.prete && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recues.length > 0 && (
                <button
                  type="button"
                  disabled={occupee}
                  onClick={() => onStatut(carte, 'EN_PREPARATION', recues)}
                  className="h-11 flex-1 rounded-lg bg-primary px-4 font-semibold whitespace-nowrap text-primary-foreground transition-opacity disabled:opacity-50"
                >
                  Commencer la préparation
                </button>
              )}
              <button
                type="button"
                disabled={occupee}
                onClick={() => onStatut(carte, 'PRETE', carte.lignes)}
                className={cn(
                  'h-11 flex-1 rounded-lg px-4 font-semibold whitespace-nowrap transition-opacity disabled:opacity-50',
                  recues.length > 0 ? 'border border-emerald-600 bg-white text-emerald-700' : 'bg-emerald-600 text-white',
                )}
              >
                Marquer prête
              </button>
              <button
                type="button"
                disabled={occupee}
                onClick={() => onUrgent(carte)}
                aria-pressed={carte.urgent}
                className={cn(
                  'flex h-11 items-center gap-1.5 rounded-lg border px-3 font-semibold transition-colors disabled:opacity-50',
                  carte.urgent ? 'border-red-600 bg-red-600 text-white' : 'border-border bg-white text-red-600 hover:bg-red-50',
                )}
              >
                <Flame className="size-4" />
                Urgent
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
