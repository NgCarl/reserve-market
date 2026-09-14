import bcrypt from 'bcryptjs'

// Coût 10 : minimum recommandé par l'OWASP, environ 130 ms en local. bcryptjs tourne en JavaScript
// sur le thread principal : un coût plus élevé ralentirait nettement la connexion sur Render gratuit.
// Le coût est inscrit dans chaque hash : on pourra le monter (VPS) sans invalider les mots de passe existants.
// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
const COUT_BCRYPT = 10

export function hacherMotDePasse(motDePasse: string): Promise<string> {
  return bcrypt.hash(motDePasse, COUT_BCRYPT)
}

export function verifierMotDePasse(motDePasse: string, hash: string): Promise<boolean> {
  return bcrypt.compare(motDePasse, hash)
}
