import Link from "next/link";
import { cases } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowUpRight } from "lucide-react";

export default function CasesPage() {
  const sortedCases = [...cases].sort(
    (a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Nouveau': return 'destructive';
      case 'En cours': return 'default';
      case 'Clôturé': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Gestion des Affaires</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle Affaire
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Toutes les affaires</CardTitle>
          <CardDescription>
            Consultez, gérez et mettez à jour toutes vos affaires en cours et archivées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro d'affaire</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière mise à jour</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCases.map((caseItem) => (
                <TableRow key={caseItem.id}>
                  <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                  <TableCell>{caseItem.clientName}</TableCell>
                  <TableCell>{caseItem.caseType}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(caseItem.status)} className={caseItem.status === 'En cours' ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''}>
                      {caseItem.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(caseItem.lastUpdate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/cases/${caseItem.id}`}>
                      <Button variant="outline" size="sm">
                        Gérer
                        <ArrowUpRight className="h-4 w-4 ml-2" />
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
  );
}
