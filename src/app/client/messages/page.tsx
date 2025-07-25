"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/actions";
import { MessageList } from "@/components/MessageList";
import { MessageView } from "@/components/MessageView";
import { user, conversations as initialConversations, cases } from "@/lib/data";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { AvatarImage } from "@/components/ui/avatar";

export default function ClientMessagesPage() {
  const clientUser = user.currentUser;
  const clientConversations = initialConversations.filter(c => 
    cases.some(caseItem => caseItem.id === c.caseId && caseItem.clientId === clientUser.id)
  );

  const [conversations, setConversations] = useState(clientConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(clientConversations[0]?.id);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      const newMsg = {
        id: `msg-${Date.now()}`,
        senderId: user.currentUser.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: false
      };

      setConversations(prev => 
        prev.map(c => 
          c.id === selectedConversationId 
            ? { 
                ...c, 
                messages: [...c.messages, newMsg],
                unreadCount: 0 
              } 
            : c
        )
      );
      
      setNewMessage("");
      toast({ title: "Message envoyé", description: "Votre message a été envoyé." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'envoi du message.",
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
  }, [selectedConversation?.messages.length]);
  
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
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-[calc(100vh-4rem)] flex flex-col">
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
              onSelectConversation={setSelectedConversationId}
              currentUserId={user.currentUser.id}
              searchQuery={searchQuery}
            />
          </ScrollArea>
        </Card>

        {selectedConversation && (
          <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.lawyer.avatar} alt={user.lawyer.name} />
                  <AvatarFallback>{user.lawyer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="font-headline text-lg">
                    {user.lawyer.name}
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
                currentUserId={user.currentUser.id}
                lawyerName={user.lawyer.name}
                lawyerAvatar={user.lawyer.avatar}
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
