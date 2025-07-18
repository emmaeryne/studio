"use client";

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { conversations, user } from '@/lib/data';
import { cn } from '@/lib/utils';
import { SendHorizonal, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState(conversations[0].id);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)!;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
       <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Messagerie Sécurisée</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1">
        {/* Conversation List */}
        <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
            <CardHeader className="p-4 border-b">
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher..." className="pl-8" />
                </div>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                {conversations.map(convo => (
                    <button
                    key={convo.id}
                    onClick={() => setSelectedConversationId(convo.id)}
                    className={cn(
                        "flex items-center gap-3 p-2 rounded-lg w-full text-left transition-colors",
                        selectedConversationId === convo.id ? "bg-accent" : "hover:bg-accent/50"
                    )}
                    >
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={convo.clientAvatar} alt={convo.clientName} />
                        <AvatarFallback>{convo.clientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                        <p className="font-semibold text-sm">{convo.clientName}</p>
                        <p className="text-xs text-muted-foreground truncate">{convo.messages[convo.messages.length - 1].content}</p>
                    </div>
                    {convo.unreadCount > 0 && <Badge>{convo.unreadCount}</Badge>}
                    </button>
                ))}
                </div>
            </ScrollArea>
        </Card>

        {/* Message View */}
        <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.clientAvatar} alt={selectedConversation.clientName} />
                    <AvatarFallback>{selectedConversation.clientName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="font-headline text-lg">{selectedConversation.clientName}</CardTitle>
                    <p className="text-sm text-muted-foreground">Affaire: {selectedConversation.caseNumber}</p>
                </div>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {selectedConversation.messages.map(message => (
                <div key={message.id} className={cn(
                    "flex gap-3",
                    message.senderId === user.email ? "justify-end" : "justify-start"
                )}>
                  {message.senderId !== user.email && (
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedConversation.clientAvatar} alt={selectedConversation.clientName} />
                        <AvatarFallback>{selectedConversation.clientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                      "p-3 rounded-lg max-w-xs lg:max-w-md",
                      message.senderId === user.email ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-right mt-1 opacity-70">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                   {message.senderId === user.email && (
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <CardContent className="p-4 border-t">
            <div className="relative">
              <Input placeholder="Écrire un message..." className="pr-12" />
              <Button size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8">
                <SendHorizonal className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
