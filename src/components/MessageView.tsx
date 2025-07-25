"use client";

import { Conversation } from "@/lib/data";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";
import { staticUserData } from "@/lib/data";

interface MessageViewProps {
  conversation: Conversation;
  currentUserId: string;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export function MessageView({
  conversation,
  currentUserId,
  newMessage,
  onNewMessageChange,
  onSendMessage
}: MessageViewProps) {
  const lawyer = staticUserData.lawyer;
  const isUserLawyer = currentUserId === lawyer.id;
  
  return (
    <>
      <div className="p-4 space-y-4">
        <AnimatePresence>
          {conversation.messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-3",
                message.senderId === currentUserId ? "justify-end" : "justify-start"
              )}
            >
              {message.senderId !== currentUserId && (
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={message.senderId === lawyer.id ? lawyer.avatar : conversation.clientAvatar}
                    alt={message.senderId === lawyer.id ? lawyer.name : conversation.clientName}
                  />
                  <AvatarFallback>
                    {message.senderId === lawyer.id 
                      ? lawyer.name.charAt(0) 
                      : conversation.clientName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "p-3 rounded-lg max-w-xs lg:max-w-md relative",
                  message.senderId === currentUserId
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-right mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {message.senderId === currentUserId && (
                    <span className="ml-2">
                      {message.read ? "✓✓" : "✓"}
                    </span>
                  )}
                </p>
              </div>
              {message.senderId === currentUserId && (
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={isUserLawyer ? lawyer.avatar : conversation.clientAvatar} 
                    alt={isUserLawyer ? lawyer.name : conversation.clientName}
                  />
                  <AvatarFallback>
                    {isUserLawyer 
                      ? lawyer.name.charAt(0) 
                      : conversation.clientName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="p-4 border-t">
        <form onSubmit={onSendMessage} className="relative">
          <Input
            placeholder="Écrire un message..."
            className="pr-12"
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
            disabled={!newMessage.trim()}
          >
            <SendHorizonal className="h-5 w-5 text-muted-foreground" />
          </Button>
        </form>
      </div>
    </>
  );
}
