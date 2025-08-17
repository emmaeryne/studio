import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Ce middleware est intentionnellement minimaliste.
// Il existe pour satisfaire le compilateur Next.js.
// La logique d'authentification et de redirection a été déplacée
// dans les Server Components au sein des layouts (par exemple, src/app/dashboard/layout.tsx)
// pour éviter les problèmes de compatibilité du Edge Runtime avec firebase-admin.
export function middleware(request: NextRequest) {
  // Passe simplement la requête sans aucune logique.
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Fait correspondre tous les chemins de requête à l'exception de ceux qui commencent par :
     * - api (routes API)
     * - _next/static (fichiers statiques)
     * - _next/image (fichiers d'optimisation d'image)
     * - favicon.ico (fichier favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
