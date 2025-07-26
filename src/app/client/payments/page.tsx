
// A page for clients to view and pay their invoices.
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Invoice } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle } from "lucide-react";
import { PaymentDialog } from "@/components/payment-dialog";
import { makePayment, getClientInvoices, getCurrentUser } from "@/lib/actions";

export default function ClientPaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvoices = async () => {
        const user = await getCurrentUser();
        if (user && user.role === 'client') {
            const clientInvoices = await getClientInvoices(user.id);
            setInvoices(clientInvoices);
        }
    };
    fetchInvoices();
  }, []);

  const handlePaymentSuccess = async (invoiceId: string) => {
    const res = await makePayment(invoiceId);
    if (res.success) {
        setInvoices(
          invoices.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: "Payée" } : inv
          )
        );
        toast({
          title: "Paiement Réussi",
          description: "Votre facture a été payée avec succès.",
        });
        setSelectedInvoice(null); // Close the dialog
    } else {
        toast({
            variant: "destructive",
            title: "Erreur de paiement",
            description: res.error,
        });
    }
  };
  
  const getStatusVariant = (status: 'Payée' | 'En attente') => {
    switch (status) {
        case 'Payée': return 'default';
        case 'En attente': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <>
    <PaymentDialog 
        isOpen={!!selectedInvoice} 
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onPaymentConfirm={handlePaymentSuccess}
    />
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Mes Paiements</h1>
      <Card>
        <CardHeader>
          <CardTitle>Historique des factures</CardTitle>
          <CardDescription>
            Consultez et réglez vos factures en attente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro de facture</TableHead>
                <TableHead>Affaire</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.caseNumber}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{invoice.amount.toFixed(2)}€</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.status === "En attente" ? (
                      <Button onClick={() => setSelectedInvoice(invoice)} size="sm">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Payer maintenant
                      </Button>
                    ) : (
                      <div className="flex justify-end items-center text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4"/>
                        <span>Payée</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        Vous n'avez aucune facture.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
