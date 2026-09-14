import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { formaterPrix } from '@/lib/format'
import { nombreArticles, totalPanier, usePanier } from '@/stores/panier'
import { BoutonFermer } from './BoutonFermer'
import { SelecteurQuantite } from './SelecteurQuantite'

interface Props {
  ouvert: boolean
  onOuvertChange: (ouvert: boolean) => void
  numeroTable: number
  afficherPhotos: boolean
}

/** Panier plein écran (maquette FoodScan « My Cart »). */
export function PanierSheet({ ouvert, onOuvertChange, numeroTable, afficherPhotos }: Props) {
  const lignes = usePanier((etat) => etat.lignes)
  const changerQuantite = usePanier((etat) => etat.changerQuantite)
  const articles = nombreArticles(lignes)

  return (
    <Sheet open={ouvert} onOpenChange={onOuvertChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        // Pas de focus automatique : il surlignait la corbeille de la première ligne.
        onOpenAutoFocus={(evenement) => evenement.preventDefault()}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <div className="relative flex items-center justify-center px-5 pt-6 pb-4">
          <div className="text-center">
            <SheetTitle className="text-2xl font-bold text-marque-nuit">Mon panier</SheetTitle>
            <SheetDescription>
              Table {numeroTable} · {articles} article{articles > 1 ? 's' : ''}
            </SheetDescription>
          </div>
          <div className="absolute top-5 right-5">
            <BoutonFermer plein />
          </div>
        </div>

        {lignes.length === 0 ? (
          <p className="flex-1 p-10 text-center text-muted-foreground">
            Votre panier est vide. Parcourez la carte et ajoutez vos plats.
          </p>
        ) : (
          <ul className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-2">
            {lignes.map((ligne) => (
              <li key={ligne.cle} className="flex flex-col gap-2">
                <div className="flex items-center gap-3.5">
                  {afficherPhotos && ligne.photoUrl && (
                    <img src={ligne.photoUrl} alt="" width={64} height={64} loading="lazy" className="size-16 shrink-0 rounded-2xl object-cover" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-base leading-tight font-bold text-marque-nuit">{ligne.nom}</span>
                    {ligne.choix.map((choix) => (
                      <span key={choix.libelle} className="text-sm text-muted-foreground">{choix.libelle}</span>
                    ))}
                    <span className="text-base font-bold text-marque-nuit">{formaterPrix(ligne.prixUnitaire * ligne.quantite)}</span>
                  </div>
                  <SelecteurQuantite quantite={ligne.quantite} onChange={(quantite) => changerQuantite(ligne.cle, quantite)} min={0} libelle={ligne.nom} />
                </div>
                {ligne.note && (
                  <p className="text-sm">
                    <span className="font-semibold">Instruction :</span> <span className="text-muted-foreground">{ligne.note}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between rounded-2xl border border-border px-5 py-4">
            <span className="text-lg font-bold text-marque-nuit">Sous-total</span>
            <span className="text-lg font-bold text-emerald-600">{formaterPrix(totalPanier(lignes))}</span>
          </div>
          {/* L'envoi de la commande arrive à l'étape 5 (création en transaction côté serveur). */}
          <button
            type="button"
            disabled
            className="h-14 w-full rounded-full bg-primary text-lg font-bold text-primary-foreground disabled:opacity-40"
          >
            Passer la commande (bientôt)
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
