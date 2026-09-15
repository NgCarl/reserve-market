import { useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router'
import { useAdmin } from '@/hooks/useAdmin'
import { ErreurApi, messageErreur, requeteApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Personnel, Role } from '@/types/utilisateur'
import type { chargerPersonnel } from './admin.loader'

const ROLES: { valeur: Role; libelle: string }[] = [
  { valeur: 'ADMIN', libelle: 'Administrateur' },
  { valeur: 'CUISINE', libelle: 'Cuisine / bar' },
  { valeur: 'SERVEUR', libelle: 'Serveur' },
]

const date = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** Comptes à activer en premier, puis par nom. */
const trier = (liste: readonly Personnel[]): Personnel[] =>
  [...liste].sort((a, b) => Number(a.actif) - Number(b.actif) || a.nom.localeCompare(b.nom, 'fr'))

/** Gestion du personnel (maquette FoodScan « Waiters / Chefs ») : activer les inscriptions, changer un rôle, désactiver. */
export function PersonnelPage() {
  const utilisateur = useAdmin()
  const { personnel: initial } = useLoaderData<typeof chargerPersonnel>()
  const navigate = useNavigate()
  const [personnel, setPersonnel] = useState(() => trier(initial))
  const [occupe, setOccupe] = useState<number | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const aActiver = personnel.filter((membre) => !membre.actif).length

  const modifier = async (id: number, modification: { actif?: boolean; role?: Role }) => {
    setOccupe(id)
    setErreur(null)
    try {
      const { utilisateur: maj } = await requeteApi<{ utilisateur: Personnel }>(`/utilisateurs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modification),
      })
      setPersonnel((liste) => trier(liste.map((membre) => (membre.id === maj.id ? maj : membre))))
    } catch (probleme) {
      if (probleme instanceof ErreurApi && probleme.status === 401) {
        void navigate(`/connexion?retour=${encodeURIComponent('/admin/personnel')}`, { replace: true })
      } else {
        setErreur(messageErreur(probleme, 'Modification impossible. Réessayez.'))
      }
    } finally {
      setOccupe(null)
    }
  }

  return (
    <section className="rounded-xl bg-white shadow-[0_1px_3px_rgba(3,40,66,0.06)]">
      <div className="border-b border-border px-5 py-4">
        <h1 className="flex flex-wrap items-center gap-2 text-xl font-medium text-marque-nuit">
          Personnel
          {aActiver > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">{aActiver} à activer</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les membres de l'équipe s'inscrivent depuis la page de connexion, onglet « Inscription ». Activez ici leur compte et choisissez leur rôle.
        </p>
      </div>

      {erreur && <p role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erreur}</p>}

      <div className="overflow-x-auto">
        {/* Sur téléphone, le tableau défile horizontalement : pas de coupure au milieu d'un email. */}
        <table className="w-full min-w-[780px] text-left text-[15px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-border text-xs tracking-[0.15em] text-marque-nuit uppercase">
              <th scope="col" className="px-5 py-3.5 font-medium">Nom</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Email</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Rôle</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Statut</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Inscription</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {personnel.map((membre) => {
              const soiMeme = membre.id === utilisateur.id
              const bloque = soiMeme || occupe === membre.id
              return (
                <tr key={membre.id} className={cn('border-b border-border last:border-b-0', !membre.actif && 'bg-amber-50/50')}>
                  <td className="px-5 py-3.5 text-marque-nuit">
                    {membre.nom}
                    {soiMeme && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{membre.email}</td>
                  <td className="px-5 py-3.5">
                    <select
                      aria-label={`Rôle de ${membre.nom}`}
                      value={membre.role}
                      disabled={bloque}
                      onChange={(evenement) => {
                        const role = ROLES.find((option) => option.valeur === evenement.target.value)?.valeur
                        if (role) void modifier(membre.id, { role })
                      }}
                      className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm text-marque-nuit disabled:opacity-60"
                    >
                      {ROLES.map((option) => (
                        <option key={option.valeur} value={option.valeur}>{option.libelle}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn('rounded-md px-2.5 py-1 text-sm', membre.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-900')}>
                      {membre.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{date.format(new Date(membre.createdAt))}</td>
                  <td className="px-5 py-3.5">
                    {soiMeme ? (
                      <span className="text-sm text-muted-foreground">—</span>
                    ) : membre.actif ? (
                      <button
                        type="button"
                        disabled={bloque}
                        onClick={() => void modifier(membre.id, { actif: false })}
                        className="h-9 rounded-lg bg-red-50 px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        Désactiver
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={bloque}
                        onClick={() => void modifier(membre.id, { actif: true })}
                        className="h-9 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                      >
                        Activer
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="border-t border-border px-5 py-4 text-sm text-marque-nuit">
        {personnel.length} compte{personnel.length > 1 ? 's' : ''}
      </p>
    </section>
  )
}
