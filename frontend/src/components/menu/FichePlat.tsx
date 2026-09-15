import { ChevronDown, Info, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { formaterPrix } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePanier, type ChoixLigne, type NouvelleLigne } from '@/stores/panier'
import type { AddonPlat, PlatMenu } from '@/types/menu'
import { BoutonFermer } from './BoutonFermer'
import { PhotoPlat } from './PhotoPlat'
import { SelecteurQuantite } from './SelecteurQuantite'

const NOTE_MAX = 200
const COMPLEMENT_MAX = 20

interface Props {
  plat: PlatMenu | null
  afficherPhoto: boolean
  onFermer: () => void
  /** Autre destination que le panier du client : la saisie du serveur (§7). */
  onAjouter?: (ligne: NouvelleLigne) => void
  libelleBouton?: string
}

/** Fiche d'un plat en panneau bas (maquette FoodScan « item modal »). */
export function FichePlat({ plat, afficherPhoto, onFermer, onAjouter, libelleBouton }: Props) {
  return (
    <Sheet open={plat !== null} onOpenChange={(ouvert) => { if (!ouvert) onFermer() }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // Pas de focus automatique : sur mobile, il surligne un bouton au hasard ou ouvre le clavier.
        onOpenAutoFocus={(evenement) => evenement.preventDefault()}
        className="mx-auto max-h-[92dvh] max-w-md gap-0 overflow-y-auto rounded-t-3xl p-0"
      >
        {/* Clé par plat : chaque fiche repart de ses choix par défaut. */}
        {plat && (
          <ContenuFiche
            key={plat.id}
            plat={plat}
            afficherPhoto={afficherPhoto}
            onAjoute={onFermer}
            onAjouter={onAjouter}
            libelleBouton={libelleBouton}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

const titreSection = 'mb-3 text-lg font-bold text-marque-nuit'
const tuile = 'flex shrink-0 cursor-pointer items-center gap-3 rounded-2xl border-2 border-transparent bg-tuile p-3.5 has-checked:border-primary has-checked:bg-primary/8'
const defilement = '-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]'

interface ContenuProps {
  plat: PlatMenu
  afficherPhoto: boolean
  onAjoute: () => void
  onAjouter?: (ligne: NouvelleLigne) => void
  libelleBouton?: string
}

function ContenuFiche({ plat, afficherPhoto, onAjoute, onAjouter, libelleBouton = 'Ajouter au panier' }: ContenuProps) {
  const ajouterAuPanier = usePanier((etat) => etat.ajouter)
  const ajouter = onAjouter ?? ajouterAuPanier
  const [quantite, setQuantite] = useState(1)
  // Choix unique obligatoire : la première option de chaque groupe est retenue d'office.
  const [options, setOptions] = useState<Record<number, number>>(() =>
    Object.fromEntries(plat.groupesVariantes.flatMap((groupe) => (groupe.options[0] ? [[groupe.id, groupe.options[0].id]] : []))),
  )
  const [extras, setExtras] = useState<number[]>([])
  // Compléments (sodas, bières…) : chacun avec sa propre quantité, comme les « modules complémentaires » de FoodScan.
  const [complements, setComplements] = useState<Record<number, number>>({})
  const [note, setNote] = useState('')

  const choisir = (groupeId: number, optionId: number) => setOptions((courantes) => ({ ...courantes, [groupeId]: optionId }))
  const changerComplement = (addon: AddonPlat, nouvelle: number) =>
    setComplements((courants) => ({ ...courants, [addon.id]: Math.max(0, Math.min(COMPLEMENT_MAX, nouvelle)) }))

  const optionsChoisies = plat.groupesVariantes.flatMap((groupe) => {
    const option = groupe.options.find((candidate) => candidate.id === options[groupe.id])
    return option ? [{ groupe, option }] : []
  })
  const extrasChoisis = plat.extras.filter((extra) => extras.includes(extra.id))
  const complementsChoisis = plat.addons.flatMap((addon) => {
    const nombre = complements[addon.id] ?? 0
    return nombre > 0 ? [{ addon, nombre }] : []
  })

  const prixUnitaire = plat.prix
    + optionsChoisies.reduce((total, { option }) => total + option.supplement, 0)
    + extrasChoisis.reduce((total, extra) => total + extra.prix, 0)
  const total = prixUnitaire * quantite + complementsChoisis.reduce((somme, { addon, nombre }) => somme + addon.prix * nombre, 0)

  const valider = () => {
    const choix: ChoixLigne[] = [
      ...optionsChoisies.map(({ groupe, option }) => ({ libelle: `${groupe.nom} : ${option.nom}`, prix: option.supplement })),
      ...extrasChoisis.map((extra) => ({ libelle: `Extra : ${extra.nom}`, prix: extra.prix })),
    ]
    ajouter({
      platId: plat.id,
      nom: plat.nom,
      optionIds: optionsChoisies.map(({ option }) => option.id),
      extraIds: extrasChoisis.map((extra) => extra.id),
      choix,
      note: note.trim(),
      photoUrl: plat.photoUrl,
      prixUnitaire,
      quantite,
    })
    // Un complément est un article à part entière : sa propre ligne, qui part à son propre poste (bar ou cuisine).
    for (const { addon, nombre } of complementsChoisis) {
      ajouter({ platId: addon.id, nom: addon.nom, optionIds: [], extraIds: [], choix: [], note: '', photoUrl: addon.photoUrl, prixUnitaire: addon.prix, quantite: nombre })
    }
    onAjoute()
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="flex items-start gap-4">
        {afficherPhoto && plat.photoUrl && (
          <PhotoPlat url={plat.photoUrl} floueUrl={plat.photoFloueUrl} alt={plat.nom} className="size-24 shrink-0 rounded-2xl" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-lg leading-tight font-bold text-marque-nuit">{plat.nom}</SheetTitle>
            <Info aria-hidden="true" className="size-4 shrink-0 fill-muted-foreground text-white" />
          </div>
          <SheetDescription className={cn('text-[15px] leading-snug', !plat.description && 'sr-only')}>
            {plat.description ?? plat.nom}
          </SheetDescription>
          <span className="text-lg font-bold text-marque-nuit">
            {plat.groupesVariantes.some((groupe) => groupe.options.some((option) => option.supplement > 0)) && (
              <span className="text-xs font-medium text-muted-foreground">à partir de </span>
            )}
            {formaterPrix(plat.prix)}
          </span>
        </div>
        <BoutonFermer />
      </div>
      {afficherPhoto && plat.photoUrl && plat.photoCredit && (
        <p className="-mt-4 text-xs text-muted-foreground">Photo : {plat.photoCredit}</p>
      )}

      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-marque-nuit">Quantité :</span>
        <SelecteurQuantite quantite={quantite} onChange={setQuantite} libelle={plat.nom} />
      </div>

      {plat.groupesVariantes.map((groupe) =>
        groupe.affichage === 'LISTE' ? (
          <label key={groupe.id} className="flex flex-col">
            <span className={titreSection}>{groupe.nom}</span>
            <span className="relative">
              <select
                value={options[groupe.id]}
                onChange={(evenement) => choisir(groupe.id, Number(evenement.target.value))}
                className="h-13 w-full appearance-none rounded-2xl border-2 border-transparent bg-tuile pr-12 pl-4 text-base font-medium text-marque-nuit outline-none focus-visible:border-primary"
              >
                {groupe.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.supplement > 0 ? `${option.nom} (+${formaterPrix(option.supplement)})` : option.nom}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-primary" />
            </span>
          </label>
        ) : (
          <fieldset key={groupe.id}>
            <legend className={titreSection}>{groupe.nom}</legend>
            <div className={defilement}>
              {groupe.options.map((option) => (
                <label key={option.id} className={cn(tuile, 'min-w-40')}>
                  <input
                    type="radio"
                    name={`groupe-${groupe.id}`}
                    checked={options[groupe.id] === option.id}
                    onChange={() => choisir(groupe.id, option.id)}
                    className="size-5 shrink-0 accent-primary"
                  />
                  {afficherPhoto && option.photoUrl && (
                    <img src={option.photoUrl} alt="" width={48} height={48} loading="lazy" className="size-12 shrink-0 rounded-xl object-cover" />
                  )}
                  <span className="flex flex-col">
                    <span className="text-base font-medium whitespace-nowrap">{option.nom}</span>
                    {option.supplement > 0 && (
                      <span className="text-sm font-bold whitespace-nowrap text-marque-nuit">+{formaterPrix(option.supplement)}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ),
      )}

      {plat.extras.length > 0 && (
        <fieldset>
          <legend className={titreSection}>Extras</legend>
          <div className={defilement}>
            {plat.extras.map((extra) => (
              <label key={extra.id} className={cn(tuile, 'min-w-40')}>
                <input
                  type="checkbox"
                  checked={extras.includes(extra.id)}
                  onChange={() => setExtras((courants) => (courants.includes(extra.id) ? courants.filter((id) => id !== extra.id) : [...courants, extra.id]))}
                  className="size-5 shrink-0 accent-primary"
                />
                <span className="flex flex-col">
                  <span className="text-base font-medium whitespace-nowrap">{extra.nom}</span>
                  <span className="text-sm font-bold whitespace-nowrap text-marque-nuit">+{formaterPrix(extra.prix)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {plat.addons.length > 0 && (
        <section>
          <h3 className={titreSection}>Compléments</h3>
          <div className={defilement}>
            {plat.addons.map((addon) => (
              <CarteComplement
                key={addon.id}
                addon={addon}
                nombre={complements[addon.id] ?? 0}
                afficherPhoto={afficherPhoto}
                onChange={(nouvelle) => changerComplement(addon, nouvelle)}
              />
            ))}
          </div>
        </section>
      )}

      <label className="flex flex-col gap-3">
        <span className="text-lg font-bold text-marque-nuit">Instructions particulières</span>
        <textarea
          value={note}
          onChange={(evenement) => setNote(evenement.target.value)}
          maxLength={NOTE_MAX}
          rows={2}
          placeholder={plat.poste === 'BAR' ? 'Ex. : bien frais, avec glaçons, un verre en plus…' : 'Ex. : sans piment, bien cuit…'}
          className="resize-none rounded-2xl border border-border bg-white p-3.5 text-base outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
        />
      </label>

      <button
        type="button"
        onClick={valider}
        className="sticky bottom-0 h-14 w-full rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-[0_-8px_16px_white] transition-transform active:scale-[0.98]"
      >
        {libelleBouton} · {formaterPrix(total)}
      </button>
    </div>
  )
}

interface CarteComplementProps {
  addon: AddonPlat
  nombre: number
  afficherPhoto: boolean
  onChange: (nombre: number) => void
}

/** Carte de complément : photo à gauche, nom, prix, compteur −/+ (maquette FoodScan « modules complémentaires »). */
function CarteComplement({ addon, nombre, afficherPhoto, onChange }: CarteComplementProps) {
  const rond = 'flex size-7 items-center justify-center rounded-full border-2 border-primary text-primary disabled:opacity-30'
  return (
    <div className={cn('flex h-24 w-60 shrink-0 overflow-hidden rounded-2xl border bg-card', nombre > 0 ? 'border-primary' : 'border-border', !addon.disponible && 'opacity-50')}>
      {afficherPhoto && addon.photoUrl && (
        <img src={addon.photoUrl} alt="" width={96} height={96} loading="lazy" className="h-full w-24 shrink-0 object-cover" />
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5">
        <div className="flex flex-col">
          <span className="truncate text-sm font-semibold text-marque-nuit">{addon.nom}</span>
          <span className="text-sm font-bold text-marque-nuit">{addon.disponible ? formaterPrix(addon.prix) : 'Épuisé'}</span>
        </div>
        {addon.disponible && (
          <div className="flex items-center justify-end gap-2">
            {nombre > 0 && (
              <>
                <button type="button" className={rond} onClick={() => onChange(nombre - 1)} aria-label={`Retirer un ${addon.nom}`}>
                  <Minus className="size-3.5" />
                </button>
                <span className="w-4 text-center text-sm font-bold tabular-nums" aria-live="polite">{nombre}</span>
              </>
            )}
            <button type="button" className={rond} onClick={() => onChange(nombre + 1)} disabled={nombre >= COMPLEMENT_MAX} aria-label={`Ajouter un ${addon.nom}`}>
              <Plus className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
