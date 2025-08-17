// src/app/client/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  DollarSign,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  getClientCases,
  getClientConversations,
  getClientInvoices,
  getAppointments,
  getLawyerProfile,
} from "@/lib/actions";
import { useAuth } from "@/hooks/useAuth";
import type { Case, Conversation, Invoice, Appointment, Lawyer, Client } from "@/lib/data";

export default function ClientDashboard() {
  const { user, loading } = useAuth();
  const [lawyerUser, setLawyerUser] = useState<Lawyer | null>(null);
  const [clientCases, setClientCases] = useState<Case[]>([]);
  const [clientConversations, setClientConversations] = useState<Conversation[]>([]);
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([]);
  const [allAppointments, setAllAppointments] = useState<(Appointment & { clientName: string })[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsDataLoading(true);
        const [
          casesData,
          convosData,
          invoicesData,
          appointmentsData,
          lawyerData,
        ] = await Promise.all([
          getClientCases(user.uid),
          getClientConversations(user.uid),
          getClientInvoices(user.uid),
          getAppointments(),
          getLawyerProfile(),
        ]);
        setClientCases(casesData);
        setClientConversations(convosData);
        setClientInvoices(invoicesData);
        setAllAppointments(appointmentsData);
        setLawyerUser(lawyerData);
        setIsDataLoading(false);
      };
      fetchData();
    }
  }, [user]);

  if (loading || isDataLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2 text-muted-foreground">Chargement de votre tableau de bord...</p>
      </div>
    );
  }
  
  if (!user) {
      // AuthProvider in layout handles redirection, this is a fallback
      return null;
  }

  const clientAppointments = allAppointments.filter(app => {
      const caseExists = clientCases.some(c => c.id === app.caseId);
      return caseExists;
  });

  const stats = {
    open: clientCases.filter(c => ['En cours', 'Nouveau', 'En attente du client'].includes(c.status)).length,
    closed: clientCases.filter(c => c.status === 'Clôturé').length,
    unread: clientConversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0),
    pendingInvoices: clientInvoices.filter(i => i.status === 'En attente').length,
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Nouveau': return 'destructive';
      case 'En cours': return 'default';
      case 'Clôturé': return 'secondary';
      case 'En attente du client': return 'outline';
      default: return 'outline';
    }
  };
  
  const getLatestMessages = () => {
    if (!lawyerUser) return [];
    return clientConversations
      .flatMap(conv => conv.messages.map(msg => ({
        ...msg,
        conversationId: conv.id,
        caseNumber: conv.caseNumber,
        senderName: msg.senderId === lawyerUser.id ? lawyerUser.name : user.name,
        senderAvatar: msg.senderId === lawyerUser.id ? lawyerUser.avatar : user.avatar,
        isFromLawyer: msg.senderId === lawyerUser.id
      })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
  };

  const latestMessages = getLatestMessages();
  
  const nextAppointment = clientAppointments
      .filter(a => a.status === 'Confirmé' && new Date(a.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-1">
          Bonjour {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground">Voici un aperçu de votre activité juridique</p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {[
          {
            title: "Affaires en cours",
            icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
            value: stats.open,
            desc: "Total des affaires actives",
          },
          {
            title: "Messages non lus",
            icon: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
            value: stats.unread,
            desc: "Messages en attente",
            link: "/client/messages"
          },
          {
            title: "Factures en attente",
            icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            value: stats.pendingInvoices,
            desc: `Total de ${clientInvoices
              .filter(i => i.status === 'En attente')
              .reduce((sum, invoice) => sum + invoice.amount, 0)
              .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
          },
          {
            title: "Prochain RDV",
            icon: <Activity className="h-4 w-4 text-muted-foreground" />,
            value: nextAppointment ? new Date(nextAppointment.date).toLocaleDateString('fr-FR') : 'Aucun',
            desc: nextAppointment?.notes || '',
          }
        ].map((item, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barre de messages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messagerie
            </CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href="/client/messages">
                Voir tous les messages
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <CardDescription>
            Échangez directement avec votre avocat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Derniers messages */}
            {latestMessages.length > 0 ? (
              latestMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`p-4 rounded-lg border ${!message.read ? 'bg-blue-50 border-blue-200' : 'bg-muted/50'}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.senderAvatar} />
                      <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{message.senderName}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">{message.content}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          Affaire: {message.caseNumber}
                        </span>
                        {message.isFromLawyer && !message.read && (
                          <Badge variant="default" className="text-xs">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun message récent
              </p>
            )}

            {/* Formulaire d'envoi de message */}
            <div className="pt-4 border-t">
              <form className="flex gap-2">
                <Input 
                  placeholder="Écrivez votre message..." 
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des affaires */}
      <div>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Suivi de vos affaires</CardTitle>
              <CardDescription>
                Accédez rapidement à vos dernières affaires juridiques.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/client/cases">
                Voir tout
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientCases.slice(0, 5).map(caseItem => (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                    <TableCell>{caseItem.caseType}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(caseItem.lastUpdate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/client/cases/${caseItem.id}`}>
                        <Button variant="outline" size="sm">
                          Détails
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
