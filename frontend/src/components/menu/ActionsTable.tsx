import { Banknote, Bell, Check, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { formaterPrix } from '@/lib/format'
import { formaterNumero, LIBELLES_PAIEMENT } from '@/lib/paiement'
import { cn } from '@/lib/utils'
import type { ModePaiement } from '@/types/gestion'

/** La carte bancaire attend un prestataire (§4) : elle n'est pas proposée au client. */
type MoyenClient = Exclude<ModePaiement, 'CARTE'>
type Demande = 'APPEL_SERVEUR' | MoyenClient

interface ReponseAppel {
  appel: { type: 'APPEL_SERVEUR' | 'ADDITION'; montant: number | null; numeroPaiement: string | null }
}

interface Confirmation {
  message: string
  /** Numéro marchand à créditer, pour un règlement Mobile Money. */
  numero: string | null
  montant: number | null
  moyen: MoyenClient | null
}

/** Les deux opérateurs, aux couleurs que les clients reconnaissent. */
const OPERATEURS: { moyen: MoyenClient; classe: string }[] = [
  { moyen: 'ORANGE_MONEY', classe: 'bg-[#F16E00] text-white' },
  { moyen: 'MTN_MOMO', classe: 'bg-marque-jaune text-marque-nuit' },
]

/**
 * Boutons du client sur son suivi (CLAUDE.md §6) : appeler le serveur, ou annoncer comment il veut régler
 * (espèces, Orange Money, MTN MoMo). Rien n'est payé en ligne : le serveur est prévenu, il vient encaisser
 * et marque lui-même la commande payée.
 */
export function ActionsTable({ jeton }: { jeton: string }) {
  const [enCours, setEnCours] = useState<Demande | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const demander = async (demande: Demande) => {
    setEnCours(demande)
    setErreur(null)
    try {
      const corps = demande === 'APPEL_SERVEUR' ? { type: 'APPEL_SERVEUR' } : { type: 'ADDITION', modePaiement: demande }
      const { appel } = await requeteApi<ReponseAppel>(`/menu/${encodeURIComponent(jeton)}/appels`, enJson('POST', corps))
      setConfirmation(demande === 'APPEL_SERVEUR'
        ? { message: 'Le serveur est prévenu, il arrive.', numero: null, montant: null, moyen: null }
        : {
          message: appel.numeroPaiement
            ? 'Envoyez le montant au numéro ci-dessous, puis le serveur confirme la réception.'
            : `Addition demandée (${LIBELLES_PAIEMENT[demande]}). Le serveur arrive.`,
          numero: appel.numeroPaiement,
          montant: appel.montant,
          moyen: demande,
        })
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
        <div role="status" className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900">
          <p className="flex items-start gap-2 text-sm font-medium">
            <Check className="mt-0.5 size-4 shrink-0" />
            {confirmation.message}
          </p>
          {confirmation.numero && confirmation.moyen && (
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-emerald-800">{LIBELLES_PAIEMENT[confirmation.moyen]}</dt>
              <dd className="text-base font-bold text-marque-nuit select-all">{formaterNumero(confirmation.numero)}</dd>
              {confirmation.montant !== null && (
                <>
                  <dt className="text-emerald-800">Montant</dt>
                  <dd className="font-bold text-marque-nuit">{formaterPrix(confirmation.montant)}</dd>
                </>
              )}
            </dl>
          )}
        </div>
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
          {OPERATEURS.map(({ moyen, classe }) => (
            <button
              key={moyen}
              type="button"
              disabled={enCours !== null}
              onClick={() => void demander(moyen)}
              className={cn(bouton, 'h-14 px-3 text-sm leading-tight', classe)}
            >
              <Smartphone className="size-5 shrink-0" />
              {enCours === moyen ? 'Envoi…' : `Payer par ${LIBELLES_PAIEMENT[moyen]}`}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={enCours !== null}
          onClick={() => void demander('ESPECES')}
          className={cn(bouton, 'h-12 bg-marque-nuit text-white')}
        >
          <Banknote className="size-5 shrink-0" />
          {enCours === 'ESPECES' ? 'Envoi…' : 'Payer en espèces'}
        </button>

        <p className="text-xs text-muted-foreground">
          Le serveur vient encaisser à votre table. Pour Mobile Money, il vous indique le numéro du restaurant.
        </p>
      </div>
    </section>
  )
}
