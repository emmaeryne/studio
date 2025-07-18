// A dialog component for adding a new case.
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
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { addCase } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export function AddCaseDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newCase = {
      clientName: formData.get('clientName') as string,
      caseType: formData.get('caseType') as 'Litige civil' | 'Droit pénal' | 'Droit de la famille' | 'Droit des sociétés',
      description: formData.get('description') as string,
    };

    if (!newCase.clientName || !newCase.caseType || !newCase.description) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez remplir tous les champs obligatoires.',
        });
        return;
    }

    try {
      await addCase(newCase);
      toast({
        title: 'Affaire ajoutée',
        description: `L'affaire pour ${newCase.clientName} a été créée avec succès.`,
      });
      setOpen(false);
      router.refresh(); // Refresh the page to show the new case
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'ajouter la nouvelle affaire.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle affaire</DialogTitle>
          <DialogDescription>
            Remplissez les détails ci-dessous pour créer une nouvelle affaire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientName" className="text-right">
                Client
              </Label>
              <Input id="clientName" name="clientName" className="col-span-3" placeholder="Nom du client" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="caseType" className="text-right">
                Type
              </Label>
              <Select name="caseType">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un type d'affaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Litige civil">Litige civil</SelectItem>
                  <SelectItem value="Droit pénal">Droit pénal</SelectItem>
                  <SelectItem value="Droit de la famille">Droit de la famille</SelectItem>
                  <SelectItem value="Droit des sociétés">Droit des sociétés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" name="description" className="col-span-3" placeholder="Brève description de l'affaire" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Créer l'affaire</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
