// A dialog component for clients to request an appointment.
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { requestAppointment } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Calendar } from './ui/calendar';
import type { Case } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const availableTimeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
]

export function RequestAppointmentDialog({ children, cases }: { children: React.ReactNode, cases: Case[] }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const appointmentData = {
      caseId: formData.get('caseId') as string,
      date: date?.toISOString().split('T')[0] ?? '',
      time: formData.get('time') as string,
      notes: formData.get('notes') as string,
    };

    if (!appointmentData.caseId || !appointmentData.date || !appointmentData.time) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez sélectionner une affaire, une date et un créneau horaire.',
        });
        return;
    }

    try {
      await requestAppointment(appointmentData);
      toast({
        title: 'Rendez-vous demandé',
        description: `Votre demande de rendez-vous a été envoyée. Vous recevrez une notification après confirmation.`,
      });
      setOpen(false);
      router.refresh(); 
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'envoyer la demande de rendez-vous.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg">
        <DialogHeader>
          <DialogTitle>Demander un rendez-vous</DialogTitle>
          <DialogDescription>
            Sélectionnez une affaire, une date et un créneau horaire pour votre rendez-vous.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
             {/* Date and Time Selection */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label className='mb-2 block'>Date</Label>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border p-0"
                        disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1)) }
                    />
                </div>
                <div>
                     <Label className='mb-2 block'>Heure</Label>
                     <RadioGroup name="time" className="grid grid-cols-2 gap-2">
                        {availableTimeSlots.map(time => (
                            <div key={time}>
                                <RadioGroupItem value={time} id={`time-${time}`} className='peer sr-only'/>
                                <Label htmlFor={`time-${time}`} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm">
                                    {time}
                                </Label>
                            </div>
                        ))}
                     </RadioGroup>
                </div>
            </div>
            {/* Case and Notes */}
            <div className='space-y-4'>
                <div>
                    <Label htmlFor="caseId">Affaire concernée</Label>
                    <Select name="caseId" required defaultValue={cases.length === 1 ? cases[0].id : undefined}>
                        <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une affaire" />
                        </SelectTrigger>
                        <SelectContent>
                        {cases.map(caseItem => (
                            <SelectItem key={caseItem.id} value={caseItem.id}>{caseItem.caseNumber} - {caseItem.caseType}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="notes">
                        Notes (optionnel)
                    </Label>
                    <Textarea id="notes" name="notes" placeholder="Motif du rendez-vous..." />
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Envoyer la demande</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
