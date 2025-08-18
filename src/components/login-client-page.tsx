
// This component now contains all logic for the login page and the auth dialog
// to resolve a persistent build error.
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AuthDialog } from "@/components/auth-dialog";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, User } from "lucide-react";


export function LoginClientPage() {
  const [dialogRole, setDialogRole] = useState<'lawyer' | 'client' | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'lawyer' || role === 'client') {
      setDialogRole(role);
    }
  }, [searchParams]);

  if (!searchParams) {
    return null; 
  }
  

  return (
    <>
      <AuthDialog
        role={dialogRole}
        isOpen={!!dialogRole}
        onClose={() => setDialogRole(null)}
      />
      
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-accent/10">
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl text-center"
            >
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-headline font-bold">
                  Bienvenue sur AvocatConnect
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  La solution digitale pour une gestion juridique efficace.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card
                    className="p-8 cursor-pointer shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary h-full flex flex-col justify-center"
                    onClick={() => setDialogRole("lawyer")}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <Briefcase className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="font-headline text-2xl">
                      Espace Avocat
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Gérez vos affaires, communiquez avec vos clients et suivez votre activité.
                    </CardDescription>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card
                    className="p-8 cursor-pointer shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary h-full flex flex-col justify-center"
                    onClick={() => setDialogRole("client")}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <User className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="font-headline text-2xl">
                      Espace Client
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Suivez vos affaires, échangez des documents et communiquez avec votre avocat.
                    </CardDescription>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
        </main>
        <footer className="text-center py-4">
            <p className="text-sm text-muted-foreground">Développée par Emna Awini</p>
        </footer>
      </div>
    </>
  );
}

