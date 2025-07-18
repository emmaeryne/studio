"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appointments } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const selectedDayAppointments = appointments.filter(
    (appointment) =>
      new Date(appointment.date).toDateString() === date?.toDateString()
  );

  const eventsByDate = appointments.reduce((acc, app) => {
    const appDate = new Date(app.date).toDateString();
    if (!acc[appDate]) {
      acc[appDate] = [];
    }
    acc[appDate].push(app);
    return acc;
  }, {} as Record<string, typeof appointments>);

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Calendrier</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Planifier un RDV
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardContent className="p-0">
                 <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="p-0 [&_td]:w-14 [&_td]:h-14 [&_th]:w-14"
                    classNames={{
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent/50 text-accent-foreground",
                    }}
                    components={{
                        DayContent: ({ date }) => {
                          const dailyEvents = eventsByDate[date.toDateString()];
                          return (
                            <div className="relative h-full w-full flex items-center justify-center">
                              <p>{date.getDate()}</p>
                              {dailyEvents && (
                                <div className="absolute bottom-1 flex gap-0.5">
                                  {dailyEvents.slice(0, 3).map((_, index) => (
                                    <div key={index} className="h-1.5 w-1.5 rounded-full bg-primary" />
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
              Rendez-vous pour le {date ? date.toLocaleDateString() : "..."}
            </CardTitle>
            <CardDescription>
              Liste des rendez-vous pour la journée sélectionnée.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDayAppointments.length > 0 ? (
              selectedDayAppointments.map((appointment, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{appointment.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.notes}
                      </p>
                    </div>
                    <Badge variant="outline">{appointment.time}</Badge>
                  </div>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-1" asChild>
                    <Link href={`/dashboard/cases/${appointment.caseId}`}>Voir l'affaire</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground pt-8">
                Aucun rendez-vous pour cette date.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
