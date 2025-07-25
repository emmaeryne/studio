import { notFound } from "next/navigation";
import { cases, user } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Briefcase, Calendar, Clock, FileText, Wand2 } from "lucide-react";
import Link from "next/link";
import { ClientDocumentUploader } from "@/components/client-document-uploader";
import { RequestAppointmentDialog } from "@/components/request-appointment-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ClientCaseDetailPage({ params: { id } }: { params: { id: string } }) {
  const clientUser = user.currentUser;
  const caseItem = cases.find((c) => c.id === id && c.clientId === clientUser.id);

  if (!caseItem) {
    notFound();
  }
  
  // The estimate is temporarily stored on the case object after creation.
  // We show it once, and then it can be "cleared" in a real app.
  const estimate = caseItem._estimate;
  if(caseItem._estimate) {
    delete caseItem._estimate;
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Nouveau': return 'destructive';
      case 'En cours': return 'default';
      case 'Clôturé': return 'secondary';
      case 'En attente du client': return 'outline';
      default: return 'outline';
    }
  };

  const getAppointmentStatusVariant = (status: string) => {
    switch (status) {
      case 'Confirmé': return 'default';
      case 'En attente': return 'secondary';
      case 'Annulé': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="outline" asChild>
            <Link href="/client/cases">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à mes affaires
            </Link>
        </Button>
      </div>
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold">{caseItem.caseNumber}</h1>
            <p className="text-muted-foreground">{caseItem.caseType}</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Statut :</span>
            <Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>
        </div>
      </div>

      {estimate && (
        <Alert>
            <Wand2 className="h-4 w-4" />
            <AlertTitle>Affaire Soumise & Estimation du Coût</AlertTitle>
            <AlertDescription>
                <p className="text-2xl font-bold text-primary">{estimate.estimatedCost}</p>
                <p className='mt-2'>{estimate.justification}</p>
                <p className='mt-2 text-xs text-muted-foreground'>Ceci est une estimation préliminaire générée par l'IA. Votre avocat vous fournira un devis détaillé.</p>
            </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/>Résumé de l'affaire</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{caseItem.description}</p>
            </CardContent>
          </Card>
          
          <ClientDocumentUploader caseItem={caseItem} />

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
                )) : <p className="text-muted-foreground">Aucune échéance à venir.</p>}
              </ul>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Calendar className="h-5 w-5 text-primary"/>Rendez-vous</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {caseItem.appointments.length > 0 ? caseItem.appointments.map((appointment, i) => (
                  <li key={i} className="flex items-start gap-3">
                     <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-medium">{new Date(appointment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {appointment.time}</p>
                            <Badge variant={getAppointmentStatusVariant(appointment.status)} className="text-xs">{appointment.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">{appointment.notes}</p>
                    </div>
                  </li>
                )) : <p className="text-muted-foreground">Aucun rendez-vous planifié.</p>}
              </ul>
              <RequestAppointmentDialog cases={[caseItem]}>
                <Button variant="secondary" className="w-full mt-4">
                  Planifier un rendez-vous
                </Button>
              </RequestAppointmentDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
