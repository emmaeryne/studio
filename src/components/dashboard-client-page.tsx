
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
import { Briefcase, CheckCircle2, Archive, Clock, ArrowUpRight, PlusCircle, Calendar as CalendarIcon, Check, Edit, BarChart3, Bell, Loader2 } from "lucide-react";
import { AddCaseDialog } from "@/components/add-case-dialog";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateAppointmentStatus, getCases, getAppointments } from "@/lib/actions";
import { useRouter } from "next/navigation";
import type { Appointment, Case } from "@/lib/data";
import { RescheduleAppointmentDialog } from "@/components/reschedule-appointment-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";


const chartConfig = {
  cases: {
    label: "Affaires",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function DashboardClientPage() {
  const { user, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [appointments, setAppointments] = useState<(Appointment & { clientName: string })[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<(Appointment & { clientName: string }) | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    if (user) {
      setIsDataLoading(true);
      Promise.all([
        getCases(user.uid),
        getAppointments(user.uid)
      ]).then(([casesData, appointmentsData]) => {
        setCases(casesData);
        setAppointments(appointmentsData);
        setIsDataLoading(false);
      });
    }
  }, [user]);

  const handleCaseAdded = (newCase: Case) => {
    setCases(prev => [newCase, ...prev]);
  };

  const stats = {
    total: cases.length,
    inProgress: cases.filter((c) => c.status === "En cours").length,
    closed: cases.filter((c) => c.status === "Clôturé").length,
    new: cases.filter((c) => c.status === "Nouveau").length,
  };

  const recentCases = cases
    .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
    .slice(0, 5);

  const upcomingAppointments = appointments
    .filter(a => new Date(a.date) >= new Date() && ['Confirmé', 'En attente'].includes(a.status))
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  
  const monthlyCaseData = useMemo(() => {
    const data: { [key: string]: number } = {};
    cases.forEach(c => {
      const month = format(new Date(c.submittedDate), "MMM yyyy", { locale: fr });
      if (!data[month]) {
        data[month] = 0;
      }
      data[month]++;
    });
    
    const sortedMonths = Object.keys(data).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return sortedMonths.map(month => ({
      name: month,
      cases: data[month]
    }));

  }, [cases]);


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
      case 'Reporté': return 'outline';
      default: return 'outline';
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      const res = await updateAppointmentStatus(id, 'Confirmé');
      if (res.success && res.updatedAppointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'Confirmé' } : a))
        );
        toast({
          title: "Rendez-vous Confirmé",
          description: `Le rendez-vous a été confirmé.`,
        });
        router.refresh(); 
      } else {
        throw new Error(res.error || 'Unknown error');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la confirmation.",
      });
    }
  };
  
  const handleRescheduleSuccess = (updatedAppointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updatedAppointment.id ? { ...a, ...updatedAppointment, clientName: (a as any).clientName } : a))
    );
     router.refresh(); 
  }

  const quickTasks = [
    ...appointments.filter(a => a.status === 'En attente').map(a => ({ type: 'appointment', text: `Confirmer RDV avec ${a.clientName}`, link: '/dashboard/calendar' })),
    ...cases.filter(c => c.status === 'En attente du client').map(c => ({ type: 'case', text: `Suivi client pour affaire ${c.caseNumber}`, link: `/dashboard/cases/${c.id}` })),
  ].slice(0, 5);


  if (authLoading || isDataLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2 text-muted-foreground">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <>
    <RescheduleAppointmentDialog 
        appointment={appointmentToReschedule}
        isOpen={!!appointmentToReschedule}
        onClose={() => setAppointmentToReschedule(null)}
        onSuccess={handleRescheduleSuccess}
    />
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold">Tableau de Bord</h1>
            <p className="text-muted-foreground">Bienvenue sur votre espace professionnel.</p>
        </div>
        <AddCaseDialog onCaseAdded={handleCaseAdded}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle Affaire
          </Button>
        </AddCaseDialog>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 {[
                    { title: "Affaires en cours", value: stats.inProgress, icon: Briefcase, color: "text-primary" },
                    { title: "Affaires Clôturées", value: stats.closed, icon: CheckCircle2, color: "text-green-600" },
                    { title: "Nouvelles Affaires", value: stats.new, icon: Archive, color: "text-amber-600" },
                    { title: "Échéances Proches", value: cases.reduce((acc, c) => acc + (c.keyDeadlines?.length || 0), 0), icon: Clock, color: "text-destructive" }
                ].map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.title === 'Affaires en cours' ? `${stats.total} affaires au total` : 'Ce mois-ci'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Case Activity Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><BarChart3/>Activité des Affaires</CardTitle>
                    <CardDescription>Aperçu mensuel des nouvelles affaires créées.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart accessibilityLayer data={monthlyCaseData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1, 3)}
                            />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar dataKey="cases" fill="var(--color-cases)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Recent Cases Table */}
            <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="font-headline">Affaires Récentes</CardTitle>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/dashboard/cases">
                            Voir Tout <ArrowUpRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>
                <CardDescription>
                    Les 5 dernières affaires soumises ou mises à jour.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Dernière mise à jour</TableHead>
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
                        <TableCell className="text-right">{new Date(caseItem.lastUpdate).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-right">
                            <Link href={`/dashboard/cases/${caseItem.id}`}>
                            <Button variant="outline" size="sm">
                                Voir
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

        {/* Side Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Rendez-vous à venir</CardTitle>
                    <CardDescription>
                    Vos prochains rendez-vous.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                        <p className="text-sm font-medium leading-none">{appointment.clientName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(appointment.date).toLocaleDateString('fr-FR')} - {appointment.time}</p>
                        </div>
                        <div className="text-right flex items-center gap-1">
                            {appointment.status === 'En attente' ? (
                                <>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAppointmentToReschedule(appointment)}>
                                        <Edit className="h-4 w-4 text-blue-600"/>
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleConfirm(appointment.id)}>
                                        <Check className="h-4 w-4 text-green-600"/>
                                    </Button>
                                </>
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

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Tâches Rapides</CardTitle>
                    <CardDescription>Actions en attente ou notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                     {quickTasks.length > 0 ? quickTasks.map((task, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                                <Bell className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm">{task.text}</p>
                                <Link href={task.link}>
                                     <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                                        Voir
                                     </Button>
                                </Link>
                            </div>
                        </div>
                     )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucune tâche en attente.</p>
                     )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    </>
  );
}
