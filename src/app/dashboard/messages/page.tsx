"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendMessage, getConversations } from "@/lib/actions";
import { MessageList } from "@/components/MessageList";
import { MessageView } from "@/components/MessageView";
import { staticUserData, Conversation } from "@/lib/data";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { AvatarImage } from "@/components/ui/avatar";

export default function LawyerMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchConversations = async () => {
        const allConversations = await getConversations();
        setConversations(allConversations);
        if (allConversations.length > 0) {
            setSelectedConversationId(allConversations[0].id);
        }
    }
    fetchConversations();
  }, []);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      const sentMessage = await sendMessage(selectedConversationId, newMessage, staticUserData.lawyer.id);

      if (sentMessage.success && sentMessage.newMessage) {
         setConversations(prev => 
            prev.map(c => 
              c.id === selectedConversationId 
                ? { 
                    ...c, 
                    messages: [...c.messages, sentMessage.newMessage!],
                  } 
                : c
            )
          );
          setNewMessage("");
          toast({ title: "Message envoyé", description: "Votre message a été envoyé." });
      } else {
        throw new Error(sentMessage.error)
      }
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

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-[calc(100vh-4rem)] flex flex-col">
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
              currentUserId={staticUserData.lawyer.id}
              searchQuery={searchQuery}
            />
          </ScrollArea>
        </Card>

        {selectedConversation && (
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
                currentUserId={staticUserData.lawyer.id}
                lawyerName={staticUserData.lawyer.name}
                lawyerAvatar={staticUserData.lawyer.avatar}
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
