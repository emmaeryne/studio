
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DollarSign, FileSignature, Loader2 } from 'lucide-react';
import type { Case } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { createInvoice } from '@/lib/actions';

interface FinancialManagementProps {
  caseItem: Case;
  onUpdate: () => void;
}

export function FinancialManagement({ caseItem, onUpdate }: FinancialManagementProps) {
  const [totalCost, setTotalCost] = useState(caseItem.totalCost || '');
  const [firstInstallment, setFirstInstallment] = useState(caseItem.firstInstallment || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateInvoice = async () => {
    const total = parseFloat(String(totalCost));
    const installment = parseFloat(String(firstInstallment));

    if (isNaN(total) || isNaN(installment) || total <= 0 || installment <= 0) {
      toast({
        variant: 'destructive',
        title: 'Montants invalides',
        description: 'Veuillez saisir des montants valides pour les coûts.',
      });
      return;
    }

    if (installment > total) {
      toast({
        variant: 'destructive',
        title: 'Montant invalide',
        description: "La première tranche ne peut pas être supérieure au coût total.",
      });
      return;
    }

    setIsLoading(true);
    try {
        const result = await createInvoice({
            caseId: caseItem.id,
            totalCost: total,
            firstInstallment: installment,
        });

        if (result.success) {
            toast({
                title: 'Facture Générée',
                description: `La facture pour ${caseItem.clientName} a été créée et le client a été notifié.`,
            });
            onUpdate(); // Refresh the case details on the parent page
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: (error as Error).message || "Impossible de générer la facture.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Gestion Financière
        </CardTitle>
        <CardDescription>Définissez les coûts de l'affaire et générez la facture pour la première tranche.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {caseItem.totalCost ? (
             <div className="p-4 bg-secondary rounded-lg text-sm">
                <p>
                    <span className="font-semibold">Coût Total de l'affaire :</span> {caseItem.totalCost.toFixed(2)}€
                </p>
                 <p>
                    <span className="font-semibold">Première tranche facturée :</span> {caseItem.firstInstallment?.toFixed(2)}€
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    Une facture a déjà été générée pour cette affaire.
                </p>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="totalCost">Coût Total (€)</Label>
                    <Input
                    id="totalCost"
                    type="number"
                    placeholder="5000"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="firstInstallment">Première Tranche (€)</Label>
                    <Input
                    id="firstInstallment"
                    type="number"
                    placeholder="1500"
                    value={firstInstallment}
                    onChange={(e) => setFirstInstallment(e.target.value)}
                    />
                </div>
                </div>
                <Button onClick={handleGenerateInvoice} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Génération...
                        </>
                    ) : (
                        <>
                            <FileSignature className="mr-2 h-4 w-4" />
                            Générer la Facture
                        </>
                    )}
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
