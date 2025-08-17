// src/app/client/messages/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendMessage, getClientConversations, getLawyerProfile, markConversationAsRead } from "@/lib/actions";
import { MessageList } from "@/components/MessageList";
import { MessageView } from "@/components/MessageView";
import { type Conversation, type Lawyer } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export default function ClientMessagesPage() {
  const { user: clientUser, loading } = useAuth();
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clientUser && clientUser.role === 'client') {
      const fetchData = async () => {
          const [clientConversations, lawyerProfile] = await Promise.all([
            getClientConversations(clientUser.uid),
            getLawyerProfile()
          ]);

          setLawyer(lawyerProfile);
          setConversations(clientConversations);

          if (clientConversations.length > 0) {
              const firstConvoId = clientConversations[0].id;
              await handleSelectConversation(firstConvoId);
          }
      };
      fetchData();
    }
  }, [clientUser]);

  const handleSelectConversation = async (convoId: string) => {
      setSelectedConversationId(convoId);
      const conversation = conversations.find(c => c.id === convoId);
      if (conversation && conversation.unreadCount > 0 && clientUser) {
          const success = await markConversationAsRead(convoId, clientUser.uid);
          if (success) {
              setConversations(prev => {
                const newConversations = prev.map(c => c.id === convoId ? {...c, unreadCount: 0} : c);
                const updatedConvo = newConversations.find(c => c.id === convoId);
                if (updatedConvo) {
                    updatedConvo.unreadCount = 0;
                }
                return newConversations;
              });
          }
      }
  }


  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || !clientUser) return;

    try {
      const sentMessage = await sendMessage(selectedConversationId, newMessage, clientUser.uid);
      
      if (sentMessage.success && sentMessage.newMessage) {
        setConversations(prev => 
            prev.map(c => 
              c.id === selectedConversationId 
                ? { 
                    ...c, 
                    messages: [...c.messages, sentMessage.newMessage!],
                    unreadCount: 0 
                  } 
                : c
            )
          );
          setNewMessage("");
      } else {
        throw new Error(sentMessage.error || "Failed to send message");
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
                <CardTitle className="font-headline text-xl">Aucune conversation</CardTitle>
                <CardContent className="pt-4">
                    <p className="text-muted-foreground">Vous n'avez pas encore de messages. Une conversation sera créée lorsque vous ou votre avocat enverrez le premier message concernant une affaire.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Messagerie</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une conversation..."
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
              onSelectConversation={handleSelectConversation}
              currentUserId={clientUser!.uid}
              searchQuery={searchQuery}
            />
          </ScrollArea>
        </Card>

        {selectedConversation && lawyer && clientUser && (
          <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                  <AvatarFallback>{lawyer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="font-headline text-lg">
                    {lawyer.name}
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
                currentUserId={clientUser.uid}
                currentUserAvatar={clientUser.avatar}
                otherUserName={lawyer.name}
                otherUserAvatar={lawyer.avatar}
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
