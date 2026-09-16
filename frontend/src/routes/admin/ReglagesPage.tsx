import { Check, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useLoaderData } from 'react-router'
import { BarreEnregistrement } from '@/components/admin/BarreEnregistrement'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { classeChamp } from '@/lib/formulaire'
import { formaterNumero, LIBELLES_PAIEMENT } from '@/lib/paiement'
import type { ReglagesRestaurant } from '@/types/gestion'
import type { chargerReglages } from './admin.loader'

const CHAMPS = [
  { cle: 'numeroOrangeMoney', moyen: 'ORANGE_MONEY', exemple: '699 00 00 00' },
  { cle: 'numeroMtnMomo', moyen: 'MTN_MOMO', exemple: '670 00 00 00' },
] as const

/** Réglages du paiement : numéros marchands montrés au client qui règle par Mobile Money (§4). */
export function ReglagesPage() {
  const { restaurant } = useLoaderData<typeof chargerReglages>()
  const [valeurs, setValeurs] = useState({
    numeroOrangeMoney: restaurant.numeroOrangeMoney ?? '',
    numeroMtnMomo: restaurant.numeroMtnMomo ?? '',
  })
  const [enregistre, setEnregistre] = useState<ReglagesRestaurant>(restaurant)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const modifie = valeurs.numeroOrangeMoney !== (enregistre.numeroOrangeMoney ?? '')
    || valeurs.numeroMtnMomo !== (enregistre.numeroMtnMomo ?? '')

  const enregistrer = async () => {
    setEnCours(true)
    setErreur(null)
    setMessage(null)
    try {
      const { restaurant: sauvegarde } = await requeteApi<{ restaurant: ReglagesRestaurant }>(
        '/gestion/restaurant/paiement',
        enJson('PATCH', valeurs),
      )
      setEnregistre(sauvegarde)
      setValeurs({ numeroOrangeMoney: sauvegarde.numeroOrangeMoney ?? '', numeroMtnMomo: sauvegarde.numeroMtnMomo ?? '' })
      setMessage('Numéros enregistrés.')
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Enregistrement impossible. Vérifiez les numéros puis réessayez.'))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-28">
      <header>
        <h1 className="text-2xl font-bold text-marque-nuit">Paiement</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Ces numéros s'affichent au client qui choisit Orange Money ou MTN MoMo, et sur le téléphone du serveur au
          moment d'encaisser. Le serveur confirme lui-même la réception de l'argent : rien n'est validé par le client.
        </p>
      </header>

      {message && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 font-medium text-emerald-800">
          <Check className="size-5 shrink-0" />
          {message}
        </p>
      )}
      {erreur && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700">{erreur}</p>}

      <section className="grid gap-5 rounded-xl bg-white p-5 ring-1 ring-border sm:max-w-xl">
        {CHAMPS.map(({ cle, moyen, exemple }) => (
          <label key={cle} className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 font-semibold text-marque-nuit">
              <Smartphone className="size-4 text-muted-foreground" />
              Numéro {LIBELLES_PAIEMENT[moyen]}
            </span>
            <input
              type="tel"
              inputMode="tel"
              value={formaterNumero(valeurs[cle])}
              // Les espaces de confort sont retirés : l'API reçoit 9 chiffres.
              onChange={(evenement) => setValeurs((etat) => ({ ...etat, [cle]: evenement.target.value.replaceAll(/\s/g, '') }))}
              placeholder={exemple}
              className={classeChamp}
            />
            <span className="text-sm text-muted-foreground">9 chiffres commençant par 6. Laisser vide pour ne pas proposer ce moyen.</span>
          </label>
        ))}
      </section>

      <BarreEnregistrement
        modifie={modifie}
        enCours={enCours}
        onEnregistrer={() => void enregistrer()}
        onAnnuler={() => setValeurs({
          numeroOrangeMoney: enregistre.numeroOrangeMoney ?? '',
          numeroMtnMomo: enregistre.numeroMtnMomo ?? '',
        })}
      />
    </div>
  )
}
