import { notFound } from "next/navigation";
import { cases } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CaseDocumentUploader } from "@/components/case-document-uploader";
import { ArrowLeft, Briefcase, Calendar, Clock, FileText, User } from "lucide-react";
import Link from "next/link";

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const caseItem = cases.find((c) => c.id === params.id);

  if (!caseItem) {
    notFound();
  }
  
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
      <div>
        <Button variant="outline" asChild>
            <Link href="/dashboard/cases">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux affaires
            </Link>
        </Button>
      </div>
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold">{caseItem.caseNumber}</h1>
            <p className="text-muted-foreground">{caseItem.clientName}</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Statut :</span>
            <Badge variant={getStatusVariant(caseItem.status)} className={caseItem.status === 'En cours' ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''}>
                {caseItem.status}
            </Badge>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/>Détails de l'affaire</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-semibold">Type d'affaire:</div>
                <div>{caseItem.caseType}</div>
                <div className="font-semibold">Date de soumission:</div>
                <div>{new Date(caseItem.submittedDate).toLocaleDateString()}</div>
                <div className="font-semibold">Dernière mise à jour:</div>
                <div>{new Date(caseItem.lastUpdate).toLocaleDateString()}</div>
              </dl>
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{caseItem.description}</p>
              </div>
            </CardContent>
          </Card>
          <CaseDocumentUploader />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {caseItem.documents.length > 0 ? caseItem.documents.map((doc, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <Link href={doc.url} className="text-primary hover:underline truncate pr-2">{doc.name}</Link>
                    <Button variant="outline" size="sm">Télécharger</Button>
                  </li>
                )) : <p className="text-muted-foreground">Aucun document.</p>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/>Échéances Clés</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {caseItem.keyDeadlines.length > 0 ? caseItem.keyDeadlines.map((deadline, i) => (
                  <li key={i} className="flex items-start gap-3">
                     <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                        <p className="font-medium">{new Date(deadline.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-muted-foreground">{deadline.description}</p>
                    </div>
                  </li>
                )) : <p className="text-muted-foreground">Aucune échéance.</p>}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
