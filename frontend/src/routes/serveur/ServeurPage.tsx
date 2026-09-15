import { ConciergeBell } from 'lucide-react'
import { useLoaderData } from 'react-router'
import { EnteteStaff } from '@/components/cuisine/EnteteStaff'
import type { chargerServeur } from './serveur.loader'

/**
 * Espace serveur. La saisie des commandes, le service et l'encaissement arrivent à l'étape 8 (CLAUDE.md §13) ;
 * la page existe déjà pour qu'un serveur connecté arrive sur son espace, avec la déconnexion.
 */
export function ServeurPage() {
  const { utilisateur } = useLoaderData<typeof chargerServeur>()

  return (
    <div className="min-h-dvh bg-[#f5f6fa]">
      <EnteteStaff utilisateur={utilisateur} lienBackOffice={utilisateur.role === 'ADMIN'} />
      <main className="flex justify-center p-4 sm:p-8">
        <section className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ConciergeBell className="size-8" />
          </span>
          <h1 className="text-2xl font-bold text-marque-nuit">Espace serveur</h1>
          <p className="text-muted-foreground">
            Bonjour {utilisateur.nom}. La prise de commande à table, le service des plats et l'encaissement arrivent dans la prochaine version.
          </p>
        </section>
      </main>
    </div>
  )
}
