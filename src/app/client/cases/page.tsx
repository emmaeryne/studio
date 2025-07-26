
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, ArrowUpRight } from "lucide-react";
import { getClientCases, getCurrentUser } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { AddClientCaseDialog } from "@/components/add-client-case-dialog";
import { redirect } from "next/navigation";

export default async function ClientCasesPage() {
  const clientUser = await getCurrentUser();
  if (!clientUser || clientUser.role !== 'client') {
    redirect('/login');
  }

  const clientCases = await getClientCases(clientUser.id);

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Mes Affaires</h1>
        <AddClientCaseDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Soumettre une nouvelle affaire
          </Button>
        </AddClientCaseDialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientCases.map(caseItem => (
            <Card key={caseItem.id}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="font-headline text-lg">{caseItem.caseNumber}</CardTitle>
                        <Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>
                    </div>
                    <CardDescription>{caseItem.caseType}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{caseItem.description}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 mr-2"/>
                        <span>{caseItem.documents?.length || 0} document(s)</span>
                    </div>
                    <div className="flex justify-end">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/client/cases/${caseItem.id}`}>
                                Voir les détails
                                <ArrowUpRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
       {clientCases.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-20">
            <CardContent className="text-center">
              <p className="text-xl font-medium">Vous n'avez aucune affaire en cours.</p>
              <p className="text-muted-foreground mb-4">Soumettez une nouvelle affaire pour commencer.</p>
              <AddClientCaseDialog>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Soumettre une nouvelle affaire
                </Button>
              </AddClientCaseDialog>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
