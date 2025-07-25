// A component for the notification bell in the header.
"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/data";

export function NotificationBell({
  notifications: initialNotifications,
  userId,
}: {
  notifications: Notification[];
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    // This is a mock to simulate real-time updates.
    // In a real app, you would use WebSockets or a similar technology.
    const filteredNotifications = initialNotifications.filter(n => n.userId === userId);
    setNotifications(filteredNotifications);
  }, [initialNotifications, userId]);


  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, read: true})));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
             <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleMarkAllAsRead}>
                Marquer tout comme lu
             </Button>
          )}
        </div>
        <div className="mt-2 space-y-1 max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            [...notifications].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 rounded-md p-2",
                  !notification.read && "bg-accent/50"
                )}
              >
                <div className="flex-1">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Marquer comme lu"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucune nouvelle notification.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
