// This component needs to be a client component to handle state for the dropdown.
"use client";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaseDocumentUploader } from "@/components/case-document-uploader";
import { ArrowLeft, Briefcase, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { updateCaseStatus } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { Case } from "@/lib/data";
import { useState, useEffect } from "react";

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();
  
  // Use state to manage the case item for real-time updates on the page
  const [caseItem, setCaseItem] = useState<Case | undefined>(() => cases.find((c) => c.id === id));
  
  useEffect(() => {
    // If the case is not found initially or id changes, update the state
    setCaseItem(cases.find((c) => c.id === id));
  }, [id]);

  if (!caseItem) {
    // This part will be executed on the server during the initial render,
    // and on the client if the case isn't found after useEffect.
    // notFound() should only be called from server components,
    // so we return a friendly message on the client.
    if (typeof window !== 'undefined') {
        return <p>Affaire non trouvée.</p>;
    }
    notFound();
  }

  const handleStatusChange = async (newStatus: Case['status']) => {
    if (!caseItem) return;
    const result = await updateCaseStatus(caseItem.id, newStatus);
    if (result.success && result.updatedCase) {
        setCaseItem(result.updatedCase as Case);
        toast({
            title: "Statut mis à jour",
            description: `Le statut de l'affaire est maintenant : ${newStatus}`
        });
    } else {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: result.error
        });
    }
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

  const allStatuses: Case['status'][] = ['Nouveau', 'En cours', 'En attente du client', 'Clôturé'];

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
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={getStatusVariant(caseItem.status)} size="sm" className="h-auto py-0.5 px-2.5">
                        {caseItem.status}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {allStatuses.map(status => (
                        <DropdownMenuItem key={status} onSelect={() => handleStatusChange(status)} disabled={caseItem?.status === status}>
                            {status}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
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
                <div>{new Date(caseItem.submittedDate).toLocaleDateString('fr-FR')}</div>
                <div className="font-semibold">Dernière mise à jour:</div>
                <div>{new Date(caseItem.lastUpdate).toLocaleDateString('fr-FR')}</div>
              </dl>
              <Separator className="my-4"/>
              <div>
                <h4 className="font-semibold text-sm mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{caseItem.description}</p>
              </div>
            </CardContent>
          </Card>
          <CaseDocumentUploader caseId={caseItem.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Documents</CardTitle>
            </CardHeader>
            <CardContent>
               <ul className="space-y-3 text-sm">
                {caseItem.documents.length > 0 ? caseItem.documents.map((doc, i) => (
                  <li key={i} className="flex items-center justify-between p-2 rounded-md border">
                    <Link href={doc.url} className="text-primary hover:underline truncate pr-2 flex items-center gap-2">
                        <FileText className="h-4 w-4"/>
                        {doc.name}
                    </Link>
                    <Button variant="ghost" size="sm" asChild>
                       <a href={doc.url} download={doc.name}>
                            Télécharger
                       </a>
                    </Button>
                  </li>
                )) : <p className="text-muted-foreground text-center py-4">Aucun document pour cette affaire.</p>}
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
                )) : <p className="text-muted-foreground text-center py-4">Aucune échéance.</p>}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
