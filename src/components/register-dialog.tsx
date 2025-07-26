
// A dialog for registering a new user (client or lawyer)
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { registerUser } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegisterDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'client' | 'lawyer'>('client');
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const userData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role,
    };

    if (!userData.name || !userData.email) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerUser(userData);
      if (result.success && result.role) {
        toast({
          title: 'Compte créé',
          description: 'Votre compte a été créé avec succès. Vous êtes maintenant connecté.',
        });
        router.push(result.role === 'lawyer' ? '/dashboard' : '/client/dashboard');
      } else {
        toast({
            variant: 'destructive',
            title: 'Erreur de création',
            description: result.error || "Impossible de créer le compte.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: (error as Error).message || "Impossible de créer le compte.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau compte</DialogTitle>
          <DialogDescription>
            Remplissez les détails ci-dessous pour vous inscrire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom complet
              </Label>
              <Input id="name" name="name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" name="email" type="email" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rôle
              </Label>
              <Select name="role" required value={role} onValueChange={(value) => setRole(value as 'client' | 'lawyer')}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="lawyer">Avocat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le compte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
