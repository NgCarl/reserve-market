import { useEffect, useRef, useState } from 'react'
import { idSection } from '@/lib/menu'
import { cn } from '@/lib/utils'
import type { CategorieMenu } from '@/types/menu'

interface Props {
  categories: CategorieMenu[]
}

/** Onglets défilants : un appui fait défiler jusqu'à la catégorie, le défilement met l'onglet en surbrillance. */
export function OngletsCategories({ categories }: Props) {
  const [active, setActive] = useState<number | null>(categories[0]?.id ?? null)
  const onglets = useRef(new Map<number, HTMLButtonElement>())

  useEffect(() => {
    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees.find((entree) => entree.isIntersecting)
        if (visible) setActive(Number(visible.target.getAttribute('data-categorie')))
      },
      // Zone de détection juste sous l'en-tête et les onglets collants.
      { rootMargin: '-150px 0px -60% 0px' },
    )
    for (const categorie of categories) {
      const section = document.getElementById(idSection(categorie.id))
      if (section) observateur.observe(section)
    }
    return () => observateur.disconnect()
  }, [categories])

  useEffect(() => {
    if (active !== null) onglets.current.get(active)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [active])

  const allerA = (categorieId: number) => {
    setActive(categorieId)
    document.getElementById(idSection(categorieId))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav aria-label="Catégories du menu" className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
      {categories.map((categorie) => (
        <button
          key={categorie.id}
          type="button"
          ref={(element) => {
            if (element) onglets.current.set(categorie.id, element)
            else onglets.current.delete(categorie.id)
          }}
          onClick={() => allerA(categorie.id)}
          aria-current={active === categorie.id ? 'true' : undefined}
          className={cn(
            'flex h-12 shrink-0 items-center gap-2.5 rounded-full pr-5 text-[15px] font-semibold whitespace-nowrap transition-colors',
            categorie.imageUrl ? 'pl-1.5' : 'pl-5',
            active === categorie.id ? 'bg-primary text-primary-foreground' : 'bg-tuile text-marque-nuit',
          )}
        >
          {/* Vignette de la catégorie, comme les pictogrammes « Non végétarien » et « Légumes » de FoodScan. */}
          {categorie.imageUrl && (
            <img src={categorie.imageUrl} alt="" width={36} height={36} loading="lazy" className="size-9 rounded-full object-cover" />
          )}
          {categorie.nom}
        </button>
      ))}
    </nav>
  )
}
