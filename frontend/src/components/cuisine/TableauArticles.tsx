import type { ArticleAPreparer } from '@/lib/cuisine'
import { cn } from '@/lib/utils'

interface Props {
  articles: ArticleAPreparer[]
  className?: string
}

/** Colonne « Items Board » de FoodScan : ce qui reste à préparer, quantités cumulées. */
export function TableauArticles({ articles, className }: Props) {
  return (
    <aside className={cn('rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]', className)} aria-label="Tableau des articles">
      <h2 className="border-b border-border px-3.5 py-3 text-xl font-semibold text-marque-nuit">Tableau des articles</h2>
      {articles.length === 0 ? (
        <p className="px-3.5 py-4 text-sm text-muted-foreground">Rien à préparer pour le moment.</p>
      ) : (
        <ul>
          {articles.map((article) => (
            <li key={article.cle} className="flex items-start justify-between gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0">
              <div className="min-w-0">
                <p className="leading-snug font-medium text-marque-nuit">
                  {article.nomPlat}
                  {article.poste === 'BAR' && (
                    <span className="ml-1.5 rounded bg-marque-nuit/8 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-marque-nuit">Bar</span>
                  )}
                </p>
                {article.options.map((option) => (
                  <p key={option} className="text-xs text-marque-nuit/80">{option}</p>
                ))}
                {article.note && (
                  <p className="text-xs">
                    <span className="text-marque-nuit/80">Instruction :</span> <span className="text-muted-foreground">{article.note}</span>
                  </p>
                )}
              </div>
              <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-black px-1.5 text-sm font-semibold text-white">
                {article.quantite}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
