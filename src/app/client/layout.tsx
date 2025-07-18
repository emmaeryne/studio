import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { user } from "@/lib/data";
import { Bell, Briefcase, FileText, LayoutDashboard, MessageSquare } from "lucide-react";
import { Chatbot } from "@/components/chatbot";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientUser = user.currentUser;

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/client/dashboard"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="font-headline">AvocatConnect</span>
          </Link>
          <Link
            href="/client/dashboard"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Tableau de Bord
          </Link>
          <Link
            href="/client/cases"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Mes Affaires
          </Link>
          <Link
            href="/dashboard/messages" // Re-using the same message page for simplicity
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Messages
          </Link>
           <Link
            href="#"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Rendez-vous
          </Link>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial">
                 <Chatbot />
            </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Toggle notifications</span>
              </Button>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={clientUser.avatar} alt={clientUser.name} />
                    <AvatarFallback>{clientUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{clientUser.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Paiements</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">Changer d'utilisateur</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
