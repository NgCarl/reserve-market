import { Banknote, Bell, Check, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { formaterPrix } from '@/lib/format'
import { cn } from '@/lib/utils'

type Demande = 'APPEL_SERVEUR' | 'ESPECES' | 'MOBILE_MONEY'

interface ReponseAppel {
  appel: { type: 'APPEL_SERVEUR' | 'ADDITION'; montant: number | null }
}

/**
 * Boutons du client sur son suivi (CLAUDE.md §6) : appeler le serveur, demander l'addition.
 * Rien n'est payé en ligne : le serveur est prévenu, il vient encaisser et marque lui-même la commande payée.
 */
export function ActionsTable({ jeton }: { jeton: string }) {
  const [enCours, setEnCours] = useState<Demande | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const demander = async (demande: Demande) => {
    setEnCours(demande)
    setErreur(null)
    try {
      const corps = demande === 'APPEL_SERVEUR' ? { type: 'APPEL_SERVEUR' } : { type: 'ADDITION', modePaiement: demande }
      const { appel } = await requeteApi<ReponseAppel>(`/menu/${encodeURIComponent(jeton)}/appels`, enJson('POST', corps))
      setConfirmation(appel.type === 'ADDITION'
        ? `Addition demandée${appel.montant !== null ? ` : ${formaterPrix(appel.montant)}` : ''}, ${demande === 'ESPECES' ? 'en espèces' : 'par Mobile Money'}. Le serveur arrive.`
        : 'Le serveur est prévenu, il arrive.')
    } catch (probleme) {
      setErreur(messageErreur(probleme, "Le serveur n'a pas pu être prévenu. Réessayez ou faites-lui signe."))
    } finally {
      setEnCours(null)
    }
  }

  const bouton = 'flex items-center justify-center gap-2 rounded-full font-semibold transition-opacity disabled:opacity-50'

  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-label="Appeler le serveur ou payer">
      <h2 className="mb-3 text-lg font-bold text-marque-nuit">Le serveur</h2>

      {confirmation && (
        <p role="status" className="mb-3 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <Check className="mt-0.5 size-4 shrink-0" />
          {confirmation}
        </p>
      )}
      {erreur && <p role="alert" className="mb-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{erreur}</p>}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={enCours !== null}
          onClick={() => void demander('APPEL_SERVEUR')}
          className={cn(bouton, 'h-12 border-2 border-primary/20 text-primary')}
        >
          <Bell className="size-5" />
          {enCours === 'APPEL_SERVEUR' ? 'Envoi…' : 'Appeler le serveur'}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={enCours !== null}
            onClick={() => void demander('ESPECES')}
            className={cn(bouton, 'h-14 bg-marque-nuit px-3 text-sm leading-tight text-white')}
          >
            <Banknote className="size-5 shrink-0" />
            {enCours === 'ESPECES' ? 'Envoi…' : 'Payer en espèces'}
          </button>
          <button
            type="button"
            disabled={enCours !== null}
            onClick={() => void demander('MOBILE_MONEY')}
            className={cn(bouton, 'h-14 bg-marque-jaune px-3 text-sm leading-tight text-marque-nuit')}
          >
            <Smartphone className="size-5 shrink-0" />
            {enCours === 'MOBILE_MONEY' ? 'Envoi…' : 'Payer par Mobile Money'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Le serveur vient encaisser à votre table. Pour Mobile Money, il vous indique comment régler.
        </p>
      </div>
    </section>
  )
}
