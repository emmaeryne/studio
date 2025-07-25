
// A dialog component for adding a new case from the client portal.
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
import { addClientCase } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import type { Case } from '@/lib/data';
import { Loader2 } from 'lucide-react';

export function AddClientCaseDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const newCaseData = {
      caseType: formData.get('caseType') as Case['caseType'],
      description: formData.get('description') as string,
    };

    if (!newCaseData.caseType || !newCaseData.description) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez remplir tous les champs obligatoires.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
        const result = await addClientCase(newCaseData);
        if (result.success && result.newCaseId) {
            toast({
                title: 'Affaire Soumise',
                description: `Votre nouvelle affaire a été soumise avec succès.`,
            });
            setOpen(false);
            router.push(`/client/cases/${result.newCaseId}`);
        } else {
            throw new Error(result.error || "Failed to create case");
        }
    } catch (error) {
       console.error(error);
       toast({
          variant: 'destructive',
          title: 'Erreur',
          description: "Impossible de soumettre la nouvelle affaire. Veuillez réessayer.",
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
          <DialogTitle>Soumettre une nouvelle affaire</DialogTitle>
          <DialogDescription>
            Remplissez les détails ci-dessous. Votre avocat examinera votre demande rapidement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="caseType" className="text-right">
                  Type
              </Label>
              <Select name="caseType" required>
                  <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un type d'affaire" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="Litige civil">Litige civil</SelectItem>
                  <SelectItem value="Droit pénal">Droit pénal</SelectItem>
                  <SelectItem value="Droit de la famille">Droit de la famille</SelectItem>
                  <SelectItem value="Droit des sociétés">Droit des sociétés</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
              </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                  Description
              </Label>
              <Textarea id="description" name="description" className="col-span-3" placeholder="Brève description de votre situation" required />
              </div>
          </div>
          <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Soumettre l'affaire
              </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
