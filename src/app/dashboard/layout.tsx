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
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { getNotifications, getCurrentUser, signOut } from "@/lib/actions";
import { DashboardNav } from "@/components/dashboard-nav";
import { Briefcase, LogOut } from "lucide-react";
import { Chatbot } from "@/components/chatbot";
import { NotificationBell } from "@/components/notification-bell";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const lawyerUser = await getCurrentUser();
  if (!lawyerUser || lawyerUser.role !== 'lawyer') {
    redirect('/login');
  }

  const lawyerNotifications = await getNotifications(lawyerUser.id);


  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2 justify-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-2">
              <Briefcase className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
              <h1 className="text-xl font-headline font-bold group-data-[collapsible=icon]:hidden">
                AvocatConnect
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <DashboardNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
              <SidebarTrigger className="md:hidden" />
              <div className="w-full flex-1">
                {/* Search can be implemented later */}
              </div>
              <Chatbot />
              <NotificationBell userId={lawyerUser.id} notifications={lawyerNotifications} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={lawyerUser.avatar} alt={lawyerUser.name} />
                      <AvatarFallback>{lawyerUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Paramètres</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                   <form action={signOut}>
                     <button type="submit" className="w-full">
                       <DropdownMenuItem>
                         <LogOut className="mr-2 h-4 w-4" />
                         <span>Déconnexion</span>
                       </DropdownMenuItem>
                     </button>
                   </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
