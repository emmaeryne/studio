// A dialog for lawyers to reschedule an appointment.
'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { rescheduleAppointment } from '@/lib/actions';
import { Calendar } from './ui/calendar';
import type { Appointment } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Loader2 } from 'lucide-react';

const availableTimeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: (Appointment & { clientName: string }) | null;
  onSuccess: (updatedAppointment: Appointment) => void;
}

export function RescheduleAppointmentDialog({ isOpen, onClose, appointment, onSuccess }: RescheduleDialogProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (appointment) {
      setDate(new Date(appointment.date));
      setTime(appointment.time);
    }
  }, [appointment]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!appointment || !date || !time) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez sélectionner une nouvelle date et un créneau horaire.',
        });
        return;
    }
    
    setIsLoading(true);
    try {
      const result = await rescheduleAppointment({
        appointmentId: appointment.id,
        newDate: date.toISOString().split('T')[0],
        newTime: time
      });

      if (result.success && result.updatedAppointment) {
        toast({
            title: 'Rendez-vous reporté',
            description: `Le rendez-vous avec ${appointment.clientName} a été reporté.`,
        });
        onSuccess(result.updatedAppointment);
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de reporter le rendez-vous.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reporter le rendez-vous</DialogTitle>
          <DialogDescription>
            Modifier la date et l'heure du rendez-vous pour {appointment.clientName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div>
                <Label className='mb-2 block'>Nouvelle Date</Label>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border p-0"
                    disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
                />
            </div>
            <div>
                 <Label className='mb-2 block'>Nouvelle Heure</Label>
                 <RadioGroup name="time" value={time} onValueChange={setTime} required className="grid grid-cols-2 gap-2">
                    {availableTimeSlots.map(slot => (
                        <div key={slot}>
                            <RadioGroupItem value={slot} id={`time-${slot}`} className='peer sr-only'/>
                            <Label htmlFor={`time-${slot}`} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm">
                                {slot}
                            </Label>
                        </div>
                    ))}
                 </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer le report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
