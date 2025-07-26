
// A dialog for simulating a credit card payment.
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Invoice } from '@/lib/data';
import { Loader2, CreditCard, Landmark, Wallet, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

// You can find other card SVGs online
const VisaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" role="img" aria-labelledby="pi-visa"><title id="pi-visa">Visa</title><g fill="none"><path fill="#222" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M11.6 6.8h2.9l-4 10.4h-2.9l4-10.4zm16.8 0l-2.7 10.4h-2.9l2.7-10.4h2.9zm-8.8 0h-2.7l-2.1 7.1-1.2-7.1h-2.7l1.9 10.4h2.9l5.8-10.4h-2.8zM24.7 10.9c-.3-1.1-1.1-1.8-2.2-1.8-.9 0-1.6.5-2.1.8l-.3 1.2c.4-.2.8-.3 1.1-.3.5 0 .9.3 1.1.8.2.5.2 1 .1 1.6-.1.6-.3 1-.7 1.2s-1 .3-1.6.3h-.7l-.2-.9c0-.2 0-.3-.1-.5l-2.2 3.4h2.9c.7 0 1.3-.2 1.7-.5.4-.3.7-.8.8-1.4.2-.7.2-1.4 0-2.1z"/></g></svg>
)
const MasterCardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" role="img" aria-labelledby="pi-mastercard"><title id="pi-mastercard">Mastercard</title><path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#222"/><circle fill="#EB001B" cx="15" cy="12" r="7"/><circle fill="#F79E1B" cx="23" cy="12" r="7"/><path fill="#FF5F00" d="M22 12c0-3.9-3.1-7-7-7s-7 3.1-7 7 3.1 7 7 7 7-3.1 7-7z"/></svg>
)

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentConfirm: (invoiceId: string, method: 'card' | 'transfer' | 'cash') => Promise<void>;
}

export function PaymentDialog({ isOpen, onClose, invoice, onPaymentConfirm }: PaymentDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("card");
  const { toast } = useToast();
  const bankDetails = {
    rib: "FR76 3000 4000 0500 0012 3456 789",
    iban: "SOCIETE GENERALE",
    beneficiary: "Cabinet Légal & Associés",
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoice) return;

    setIsProcessing(true);
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    await onPaymentConfirm(invoice.id, 'card');
    setIsProcessing(false);
  };
  
  const handleOtherPayment = async (method: 'transfer' | 'cash') => {
      if (!invoice) return;
      await onPaymentConfirm(invoice.id, method);
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Les informations bancaires ont été copiées dans le presse-papiers.",
    });
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Effectuer un Paiement</DialogTitle>
          <DialogDescription>
            Facture {invoice.number} - Montant : {invoice.amount.toFixed(2)}€
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="card"><CreditCard className="mr-2 h-4 w-4"/>Carte</TabsTrigger>
                <TabsTrigger value="transfer"><Landmark className="mr-2 h-4 w-4"/>Virement</TabsTrigger>
                <TabsTrigger value="cash"><Wallet className="mr-2 h-4 w-4"/>Espèces</TabsTrigger>
            </TabsList>

            {/* Card Payment Tab */}
            <TabsContent value="card">
                <form onSubmit={handleSubmit}>
                <div className="py-4 space-y-4">
                    <div className='flex items-center justify-between bg-secondary p-2 rounded-md'>
                        <p className='text-sm text-secondary-foreground'>Cartes acceptées</p>
                        <div className='flex items-center gap-2'>
                            <VisaIcon />
                            <MasterCardIcon />
                        </div>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="card-name">Nom sur la carte</Label>
                    <Input id="card-name" placeholder="M. Dupont" required />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="card-number">Numéro de carte</Label>
                    <Input id="card-number" placeholder="1234 5678 9876 5432" required />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="expiry-date">Date d'expiration</Label>
                        <Input id="expiry-date" placeholder="MM/AA" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" required />
                    </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                        </>
                    ) : (
                        <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Payer {invoice.amount.toFixed(2)}€
                        </>
                    )}
                    </Button>
                </DialogFooter>
                </form>
            </TabsContent>

            {/* Bank Transfer Tab */}
            <TabsContent value="transfer">
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Veuillez utiliser les informations ci-dessous pour effectuer le virement bancaire. N'oubliez pas d'inclure le numéro de facture ({invoice.number}) dans le libellé de la transaction.
                    </p>
                    <div className="p-4 bg-secondary rounded-md space-y-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <Label className="text-xs">Bénéficiaire</Label>
                                <p className="font-mono">{bankDetails.beneficiary}</p>
                            </div>
                        </div>
                         <div className="flex justify-between items-center">
                            <div>
                                <Label className="text-xs">Banque</Label>
                                <p className="font-mono">{bankDetails.iban}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <Label className="text-xs">RIB</Label>
                                <p className="font-mono">{bankDetails.rib}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(bankDetails.rib)}>
                                <Copy className="h-4 w-4 mr-2"/> Copier
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Après avoir effectué le virement, cliquez sur le bouton ci-dessous. Le statut de la facture sera mis à jour après confirmation de notre part.
                    </p>
                </div>
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Fermer
                    </Button>
                    <Button onClick={() => handleOtherPayment('transfer')}>
                        J'ai effectué le virement
                    </Button>
                </DialogFooter>
            </TabsContent>

            {/* Cash Payment Tab */}
            <TabsContent value="cash">
                 <div className="py-4 space-y-4">
                     <p className="text-sm text-muted-foreground">
                        Vous pouvez régler cette facture en espèces directement à notre cabinet.
                    </p>
                    <div className="p-4 bg-secondary rounded-md">
                        <p className="font-semibold">Cabinet Légal & Associés</p>
                        <p className="text-sm">123 Rue de la Loi, 75001 Paris, France</p>
                        <p className="text-sm mt-2">Horaires : 09:00 - 17:00, Lun-Ven</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                       Cliquez sur le bouton ci-dessous si vous prévoyez de payer en espèces.
                    </p>
                 </div>
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Fermer
                    </Button>
                    <Button onClick={() => handleOtherPayment('cash')}>
                       Je paierai en espèces
                    </Button>
                </DialogFooter>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
