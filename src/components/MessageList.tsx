
"use client";

import { Conversation } from "@/lib/data";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (id: string) => void;
  currentUserId: string;
  searchQuery: string;
}

export function MessageList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId,
  searchQuery
}: MessageListProps) {
  const filteredConversations = conversations
    .filter((convo) =>
      convo.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const lastMessageA = a.messages?.[a.messages.length - 1];
      const lastMessageB = b.messages?.[b.messages.length - 1];
      const timeA = lastMessageA ? new Date(lastMessageA.timestamp).getTime() : 0;
      const timeB = lastMessageB ? new Date(lastMessageB.timestamp).getTime() : 0;
      return timeB - timeA;
    });

  return (
    <div className="p-2 space-y-1">
      <AnimatePresence>
        {filteredConversations.length > 0 ? (
          filteredConversations.map((convo) => (
            <motion.button
              key={convo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectConversation(convo.id)}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg w-full text-left transition-colors",
                selectedConversationId === convo.id
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={convo.clientAvatar} alt={convo.clientName} />
                <AvatarFallback>{convo.clientName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="font-semibold text-sm">{convo.clientName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {convo.messages?.[convo.messages.length - 1]?.content}
                </p>
              </div>
              {convo.unreadCount > 0 && (
                <Badge variant="destructive">{convo.unreadCount}</Badge>
              )}
            </motion.button>
          ))
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-muted-foreground p-4"
          >
            Aucune conversation trouvée.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
