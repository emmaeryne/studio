"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Bot, Loader2, Send } from "lucide-react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { getChatbotResponse } from "@/lib/actions";
import { cn } from "@/lib/utils";

type Message = {
    role: 'user' | 'model';
    content: string;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await getChatbotResponse({
        history: messages,
        question: input,
      });

      if (res.success && res.response) {
        const botMessage: Message = { role: "model", content: res.response };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage: Message = { role: 'model', content: res.error || "Désolé, une erreur est survenue."}
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
       const errorMessage: Message = { role: 'model', content: "Désolé, une erreur est survenue."}
       setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bot className="h-5 w-5" />
          <span className="sr-only">Toggle AI Chatbot</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Assistant IA</SheetTitle>
          <SheetDescription>
            Posez des questions d'ordre général. Pour un conseil juridique, adressez-vous directement à votre avocat.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4 -mr-6">
            <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "model" && (
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback><Bot size={18}/></AvatarFallback>
                    </Avatar>
                )}
                 <div className={cn(
                      "p-3 rounded-lg max-w-xs lg:max-w-sm text-sm",
                      message.role === 'model' ? "bg-secondary" : "bg-primary text-primary-foreground"
                  )}>
                    <p style={{ whiteSpace: 'pre-wrap'}}>{message.content}</p>
                 </div>
              </div>
            ))}
             {isLoading && (
                 <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback><Bot size={18}/></AvatarFallback>
                    </Avatar>
                     <div className="p-3 rounded-lg max-w-xs lg:max-w-sm text-sm bg-secondary">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                     </div>
                 </div>
             )}
            </div>
        </ScrollArea>
        <form onSubmit={handleSend} className="relative mt-auto">
          <Input
            placeholder="Posez votre question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="pr-12"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-5 w-5 text-muted-foreground" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
