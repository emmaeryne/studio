// src/app/dashboard/messages/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendMessage, getConversations, getAllClients } from "@/lib/actions";
import { MessageList } from "@/components/MessageList";
import { MessageView } from "@/components/MessageView";
import { type Conversation, type Lawyer, type Client } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export default function LawyerMessagesPage() {
  const { user: lawyer, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (lawyer && lawyer.role === 'lawyer') {
      const fetchData = async () => {
        const [allConversations, clients] = await Promise.all([
            getConversations(),
            getAllClients()
        ]);

        const mergedConversations = clients.map(client => {
            const existingConvo = allConversations.find(c => c.clientId === client.id);
            if (existingConvo) {
                return existingConvo;
            }
            // Create a placeholder conversation for clients without one
            return {
                id: `client-${client.id}`, // Temporary unique ID
                caseId: '',
                caseNumber: 'N/A',
                clientId: client.id,
                clientName: client.name,
                clientAvatar: client.avatar,
                unreadCount: 0,
                messages: [],
            };
        });
        
        setConversations(mergedConversations);

        if (mergedConversations.length > 0) {
            setSelectedConversationId(mergedConversations[0].id);
        }
      }
      fetchData();
    }
  }, [lawyer]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || !lawyer) return;

    try {
      const isPlaceholder = selectedConversationId.startsWith('client-');
      const conversationToUse = isPlaceholder ? undefined : selectedConversationId;

      const sentMessage = await sendMessage(conversationToUse, newMessage, lawyer.uid, selectedConversation?.clientId);

      if (sentMessage.success && sentMessage.newMessage) {
         setConversations(prev => 
            prev.map(c => 
              c.id === selectedConversationId 
                ? { 
                    ...c, 
                    id: sentMessage.conversationId || c.id,
                    messages: [...c.messages, sentMessage.newMessage!],
                  } 
                : c
            )
          );
          if (isPlaceholder && sentMessage.conversationId) {
            setSelectedConversationId(sentMessage.conversationId);
          }
          setNewMessage("");
      } else {
        throw new Error(sentMessage.error || "Failed to send message")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: (error as Error).message || "Échec de l'envoi du message.",
      });
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current && selectedConversation?.messages.length) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      }
    }
  }, [selectedConversation?.id, selectedConversation?.messages.length]);

  if (loading) {
      return (
        <div className="flex h-[calc(100vh-8rem)] w-full flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-2 text-muted-foreground">Chargement de la messagerie...</p>
        </div>
      );
  }
  
  if (conversations.length === 0) {
    return (
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-full flex flex-col items-center justify-center">
            <Card className="p-8 text-center">
                <CardTitle className="font-headline text-xl">Aucun Client</CardTitle>
                <p className="text-muted-foreground pt-4">Aucun client n'est encore enregistré dans la base de données.</p>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Messagerie Professionnelle</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <MessageList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              currentUserId={lawyer!.uid}
              searchQuery={searchQuery}
            />
          </ScrollArea>
        </Card>

        {selectedConversation && lawyer && (
            <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.clientAvatar} alt={selectedConversation.clientName} />
                    <AvatarFallback>{selectedConversation.clientName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="font-headline text-lg">
                    {selectedConversation.clientName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                    Affaire: {selectedConversation.caseNumber}
                    </p>
                </div>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <MessageView
                conversation={selectedConversation}
                currentUserId={lawyer.uid}
                currentUserAvatar={lawyer.avatar}
                otherUserName={selectedConversation.clientName}
                otherUserAvatar={selectedConversation.clientAvatar}
                newMessage={newMessage}
                onNewMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                />
            </ScrollArea>
            </Card>
        )}
      </div>
    </div>
  );
}
