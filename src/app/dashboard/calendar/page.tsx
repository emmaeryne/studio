"use client";

import { useState, useMemo } from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Check, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { updateAppointmentStatus } from "@/lib/actions";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { appointments as initialAppointments, cases } from "@/lib/data";


// Type definitions for better type safety
interface Appointment {
  id: string;
  date: string;
  time: string;
  clientName: string;
  notes: string;
  status: "Confirmé" | "En attente" | "Annulé";
  caseId: string;
}

interface EventsByDate {
  [key: string]: Appointment[];
}


export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const router = useRouter();

  // Memoize filtered appointments to optimize performance
  const selectedDayAppointments = useMemo(() => {
    if (!date) return [];
    return appointments
      .filter(
        (appointment) =>
          new Date(appointment.date).toDateString() === date.toDateString() &&
          (statusFilter === "all" || appointment.status === statusFilter)
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, date, statusFilter]);

  const eventsByDate = useMemo(() => {
    return appointments.reduce((acc: EventsByDate, app) => {
      const appDate = new Date(app.date).toDateString();
      if (!acc[appDate]) {
        acc[appDate] = [];
      }
      acc[appDate].push(app);
      return acc;
    }, {});
  }, [appointments]);

  const handleStatusUpdate = async (id: string, status: "Confirmé" | "Annulé") => {
    try {
      const res = await updateAppointmentStatus(id, status);
      if (res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
        toast({
          title: "Statut mis à jour",
          description: `Le rendez-vous a été ${status.toLowerCase()}.`,
        });
        router.refresh(); // This re-fetches server data and re-renders
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la mise à jour du statut. Veuillez réessayer.",
      });
    }
  };

  const getStatusVariant = (
    status: "Confirmé" | "En attente" | "Annulé"
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Confirmé":
        return "default";
      case "En attente":
        return "secondary";
      case "Annulé":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: "Confirmé" | "En attente" | "Annulé") => {
    switch (status) {
      case "Confirmé":
        return "bg-primary";
      case "En attente":
        return "bg-amber-500";
      case "Annulé":
        return "bg-destructive";
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Calendrier des rendez-vous
        </h1>
        {/* The "New Appointment" button is less relevant for lawyers, they manage requests */}
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Calendrier</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ShadcnCalendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="p-0 [&_td]:w-14 [&_td]:h-14 [&_th]:w-14"
              classNames={{
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent/50 text-accent-foreground",
              }}
              components={{
                DayContent: ({ date, ...props }) => {
                  const dailyEvents = eventsByDate[date.toDateString()];
                  return (
                    <div className="relative h-full w-full flex items-center justify-center">
                      <p>{date.getDate()}</p>
                      {dailyEvents && (
                        <div className="absolute bottom-1 flex gap-0.5">
                          {dailyEvents.slice(0, 3).map((event, index) => (
                            <div
                              key={index}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                getStatusColor(event.status)
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Rendez-vous pour le{" "}
              {date ? date.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "..."}
            </CardTitle>
            <CardDescription>
              Liste des rendez-vous pour la journée sélectionnée.
            </CardDescription>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Confirmé">Confirmé</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="Annulé">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {selectedDayAppointments.length > 0 ? (
                selectedDayAppointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{appointment.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.notes}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs">
                          {appointment.time}
                        </Badge>
                        <Badge
                          variant={getStatusVariant(appointment.status)}
                          className="text-xs"
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                    {appointment.status === "En attente" && (
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() =>
                            handleStatusUpdate(appointment.id, "Annulé")
                          }
                          aria-label={`Annuler le rendez-vous de ${appointment.clientName}`}
                        >
                          <X className="h-4 w-4 mr-1" /> Annuler
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-2"
                          onClick={() =>
                            handleStatusUpdate(appointment.id, "Confirmé")
                          }
                          aria-label={`Confirmer le rendez-vous de ${appointment.clientName}`}
                        >
                          <Check className="h-4 w-4 mr-1" /> Confirmer
                        </Button>
                      </div>
                    )}
                     <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-1"
                      asChild
                    >
                      <Link href={`/dashboard/cases/${appointment.caseId}`}>
                        Voir l'affaire
                      </Link>
                    </Button>
                  </motion.div>
                ))
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-muted-foreground pt-8"
                >
                  Aucun rendez-vous pour cette date.
                </motion.p>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
