import { useState } from 'react'
import { ChampMontant } from '@/components/admin/ChampMontant'
import { Interrupteur } from '@/components/admin/Interrupteur'
import { enJson, messageErreur, requeteApi } from '@/lib/api'
import { classeChamp } from '@/lib/formulaire'
import type { CategorieAdmin, PlatAdmin } from '@/types/carte'

interface Props {
  /** null : création d'un plat. */
  plat: PlatAdmin | null
  categories: CategorieAdmin[]
  onEnregistre: (plat: PlatAdmin) => void | Promise<void>
}

/** Onglet « Informations » (maquette FoodScan « Information ») : les champs du plat, modifiables. */
export function OngletInformations({ plat, categories, onEnregistre }: Props) {
  const [nom, setNom] = useState(plat?.nom ?? '')
  const [categorieId, setCategorieId] = useState(String(plat?.categorieId ?? categories[0]?.id ?? ''))
  const [prix, setPrix] = useState<number | null>(plat?.prix ?? null)
  const [description, setDescription] = useState(plat?.description ?? '')
  const [temps, setTemps] = useState<number | null>(plat?.tempsPreparationMin ?? null)
  const [disponible, setDisponible] = useState(plat?.disponible ?? true)
  const [suiviStock, setSuiviStock] = useState(plat !== null && plat.stock !== null)
  const [stock, setStock] = useState<number | null>(plat?.stock ?? null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enregistre, setEnregistre] = useState(false)

  const incomplet = nom.trim() === ''
    ? 'Le nom est obligatoire.'
    : categorieId === ''
      ? 'Choisissez une catégorie.'
      : prix === null
        ? 'Le prix est obligatoire.'
        : temps !== null && (temps < 1 || temps > 240)
          ? 'Temps de préparation : entre 1 et 240 minutes.'
          : suiviStock && stock === null
            ? 'Indiquez la quantité en stock.'
            : null

  const enregistrer = async () => {
    if (incomplet || enCours) return
    setEnCours(true)
    setErreur(null)
    setEnregistre(false)
    const corps = {
      nom,
      categorieId: Number(categorieId),
      prix,
      description: description.trim() === '' ? null : description.trim(),
      tempsPreparationMin: temps,
      disponible,
      stock: suiviStock ? stock : null,
    }
    try {
      const { plat: resultat } = await requeteApi<{ plat: PlatAdmin }>(plat ? `/plats/${plat.id}` : '/plats', enJson(plat ? 'PATCH' : 'POST', corps))
      setEnregistre(true)
      setEnCours(false)
      await onEnregistre(resultat)
    } catch (probleme) {
      setErreur(messageErreur(probleme, 'Enregistrement impossible. Réessayez.'))
      setEnCours(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={(evenement) => {
        evenement.preventDefault()
        void enregistrer()
      }}
      className="flex flex-col gap-5"
    >
      {erreur && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="plat-nom" className="text-sm font-medium text-marque-nuit">Nom</label>
          <input id="plat-nom" maxLength={120} value={nom} onChange={(evenement) => setNom(evenement.target.value)} className={classeChamp} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="plat-categorie" className="text-sm font-medium text-marque-nuit">Catégorie</label>
          <select id="plat-categorie" value={categorieId} onChange={(evenement) => setCategorieId(evenement.target.value)} className={classeChamp}>
            {categories.map((categorie) => (
              <option key={categorie.id} value={categorie.id}>
                {categorie.nom} ({categorie.poste === 'BAR' ? 'bar' : 'cuisine'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="plat-prix" className="text-sm font-medium text-marque-nuit">Prix de base</label>
          <ChampMontant id="plat-prix" valeur={prix} onChange={setPrix} />
          <p className="text-xs text-muted-foreground">Pour un plat à plusieurs tailles : le prix de la plus petite. Les suppléments se règlent dans « Tailles et choix ».</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="plat-temps" className="text-sm font-medium text-marque-nuit">Temps de préparation</label>
          <ChampMontant id="plat-temps" valeur={temps} onChange={setTemps} suffixe="min" />
          <p className="text-xs text-muted-foreground">Facultatif. Sert à repérer les commandes en retard.</p>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="plat-description" className="text-sm font-medium text-marque-nuit">Description</label>
          <textarea
            id="plat-description"
            maxLength={500}
            rows={3}
            value={description}
            onChange={(evenement) => setDescription(evenement.target.value)}
            placeholder="Ingrédients, accompagnement inclus… Visible par le client."
            className="w-full resize-y rounded-lg border border-border bg-white px-3.5 py-2.5 text-base text-marque-nuit outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
          <div>
            <p className="font-medium text-marque-nuit">Disponible</p>
            <p className="text-sm text-muted-foreground">Désactivé, le plat reste sur la carte avec la mention « Épuisé ».</p>
          </div>
          <Interrupteur actif={disponible} onChange={setDisponible} libelle="Disponible" />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-marque-nuit">Suivre le stock</p>
              <p className="text-sm text-muted-foreground">Pour les boissons en bouteille : épuisé automatiquement à 0.</p>
            </div>
            <Interrupteur actif={suiviStock} onChange={setSuiviStock} libelle="Suivre le stock" />
          </div>
          {suiviStock && <ChampMontant valeur={stock} onChange={setStock} libelle="Quantité en stock" suffixe="unités" compact />}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        <p className="mr-auto text-sm text-muted-foreground">{incomplet ?? (enregistre ? 'Enregistré.' : '')}</p>
        <button
          type="submit"
          disabled={incomplet !== null || enCours}
          className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
        >
          {enCours ? 'Enregistrement…' : plat ? 'Enregistrer' : 'Créer le plat'}
        </button>
      </div>
    </form>
  )
}
