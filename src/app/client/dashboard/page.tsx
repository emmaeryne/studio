import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  FileText,
  DollarSign
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cases, user } from "@/lib/data"

export default function ClientDashboard() {
  const clientUser = user.currentUser;
  const clientCases = cases.filter(c => c.clientId === clientUser.id);
  
  const stats = {
    open: clientCases.filter(c => c.status === 'En cours' || c.status === 'Nouveau' || c.status === 'En attente du client').length,
    closed: clientCases.filter(c => c.status === 'Clôturé').length,
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Nouveau': return 'destructive';
      case 'En cours': return 'default';
      case 'Clôturé': return 'secondary';
      case 'En attente du client': return 'outline';
      default: return 'outline';
    }
  };


  return (
    <div className="flex flex-col gap-6">
       <h1 className="text-2xl md:text-3xl font-headline font-bold">
        Bienvenue, {clientUser.name.split(' ')[0]}
      </h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Affaires en cours
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">
              Total des affaires actives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Documents Partagés
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCases.reduce((acc, c) => acc + c.documents.length, 0)}</div>
            <p className="text-xs text-muted-foreground">
              Tous les dossiers confondus
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
             <p className="text-xs text-muted-foreground">
              Total de 1,250.00€
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain RDV</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10/07/2024</div>
            <p className="text-xs text-muted-foreground">
              À 10:00 avec Maître Dupont
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Mes Affaires Récentes</CardTitle>
              <CardDescription>
                Suivez l'avancement de vos affaires juridiques.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/client/cases">
                Voir tout
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro d'affaire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientCases.slice(0, 5).map(caseItem => (
                <TableRow key={caseItem.id}>
                  <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                  <TableCell>{caseItem.caseType}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(caseItem.lastUpdate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/client/cases/${caseItem.id}`}>
                      <Button variant="outline" size="sm">
                        Voir les détails
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
