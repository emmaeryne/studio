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
import { addClientCase, getCaseCostEstimate } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import type { Case, CaseCostEstimate } from '@/lib/data';
import { Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function AddClientCaseDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<CaseCostEstimate | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const newCase = {
      caseType: formData.get('caseType') as Case['caseType'],
      description: formData.get('description') as string,
    };

    if (!newCase.caseType || !newCase.description) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez remplir tous les champs obligatoires.',
        });
        setIsLoading(false);
        return;
    }

    try {
      // Then, submit the case
      await addClientCase(newCase);
      toast({
        title: 'Affaire Soumise',
        description: `Votre nouvelle affaire a été soumise avec succès.`,
      });
      
      // First, get the cost estimate
      const estimateResult = await getCaseCostEstimate(newCase);
      if (estimateResult.success && estimateResult.estimate) {
        setEstimate(estimateResult.estimate);
      } else {
        // Continue even if estimate fails, but notify user
         toast({
          variant: 'destructive',
          title: 'Erreur d\'estimation',
          description: "Impossible d'estimer le coût, mais votre affaire a bien été soumise.",
        });
      }

      router.refresh(); 
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de soumettre la nouvelle affaire.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setEstimate(null);
      setIsLoading(false);
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{estimate ? "Affaire Soumise & Estimation" : "Soumettre une nouvelle affaire"}</DialogTitle>
          <DialogDescription>
            {estimate 
            ? "Votre affaire a été soumise. Voici une estimation préliminaire des coûts."
            : "Remplissez les détails ci-dessous. Votre avocat examinera votre demande rapidement."}
          </DialogDescription>
        </DialogHeader>
        
        {estimate ? (
            <div className='py-4 space-y-4'>
                <Alert>
                    <Wand2 className="h-4 w-4" />
                    <AlertTitle>Estimation du Coût</AlertTitle>
                    <AlertDescription>
                        <p className="text-2xl font-bold text-primary">{estimate.estimatedCost}</p>
                        <p className='mt-2 text-foreground'>{estimate.justification}</p>
                        <p className='mt-2 text-xs text-muted-foreground'>Ceci est une estimation générée par l'IA. Votre avocat vous fournira un devis détaillé.</p>
                    </AlertDescription>
                </Alert>
                <DialogFooter>
                    <Button onClick={() => handleOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </div>
        ) : (
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
                    Soumettre et Estimer
                </Button>
            </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
