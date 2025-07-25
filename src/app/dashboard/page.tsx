"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { cases, appointments as initialAppointments } from "@/lib/data";
import { Briefcase, CheckCircle2, Archive, Clock, ArrowUpRight, PlusCircle, Calendar as CalendarIcon, Check, X } from "lucide-react";
import { AddCaseDialog } from "@/components/add-case-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateAppointmentStatus } from "@/lib/actions";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/lib/data";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<(Appointment & { clientName: string })[]>(initialAppointments);
  const { toast } = useToast();
  const router = useRouter();

  const stats = {
    total: cases.length,
    inProgress: cases.filter((c) => c.status === "En cours").length,
    closed: cases.filter((c) => c.status === "Clôturé").length,
    new: cases.filter((c) => c.status === "Nouveau").length,
  };

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
    .slice(0, 5);

  const upcomingAppointments = appointments
    .filter(a => new Date(a.date) >= new Date())
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Nouveau': return 'destructive';
      case 'En cours': return 'default';
      case 'Clôturé': return 'secondary';
      case 'En attente du client': return 'outline';
      default: return 'outline';
    }
  };
  
  const getAppointmentStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Confirmé': return 'default';
      case 'En attente': return 'secondary';
      case 'Annulé': return 'destructive';
      default: return 'outline';
    }
  };

  const handleStatusUpdate = async (id: string, status: "Confirmé" | "Annulé") => {
    try {
      const res = await updateAppointmentStatus(id, status);
      if (res.success && res.updatedAppointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
        toast({
          title: "Statut mis à jour",
          description: `Le rendez-vous a été ${status === 'Confirmé' ? 'confirmé' : 'annulé'}.`,
        });
        router.refresh(); 
      } else {
        throw new Error(res.error || 'Unknown error');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la mise à jour du statut.",
      });
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Tableau de Bord</h1>
        <AddCaseDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle Affaire
          </Button>
        </AddCaseDialog>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affaires en cours</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total} affaires au total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affaires Clôturées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouvelles Affaires</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.new}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échéances Proches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cases.reduce((acc, c) => acc + c.keyDeadlines.length, 0)}
            </div>
             <p className="text-xs text-muted-foreground">
              Toutes affaires confondues
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Affaires Récentes</CardTitle>
            <CardDescription>
              Les 5 dernières affaires soumises.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell>
                      <div className="font-medium">{caseItem.clientName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {caseItem.caseNumber}
                      </div>
                    </TableCell>
                     <TableCell className="hidden sm:table-cell">{caseItem.caseType}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(caseItem.status)} className={caseItem.status === 'En cours' ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''}>
                        {caseItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{new Date(caseItem.submittedDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/cases/${caseItem.id}`}>
                        <Button variant="outline" size="sm">
                          Voir
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
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Rendez-vous à venir</CardTitle>
            <CardDescription>
              Vos prochains rendez-vous clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">{appointment.clientName}</p>
                  <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                  <div className="text-xs text-muted-foreground">{new Date(appointment.date).toLocaleDateString('fr-FR')} - {appointment.time}</div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    {appointment.status === 'En attente' ? (
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleStatusUpdate(appointment.id, 'Annulé')}>
                                <X className="h-4 w-4 text-destructive"/>
                            </Button>
                             <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleStatusUpdate(appointment.id, 'Confirmé')}>
                                <Check className="h-4 w-4 text-green-600"/>
                            </Button>
                        </div>
                    ) : (
                       <Badge variant={getAppointmentStatusVariant(appointment.status)}>{appointment.status}</Badge>
                    )}
                </div>
              </div>
            ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun rendez-vous à venir.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
