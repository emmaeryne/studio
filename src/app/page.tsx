import Link from "next/link";
import { Briefcase, User } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === 'lawyer') {
      redirect('/dashboard');
    } else {
      redirect('/client/dashboard');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-accent/10 px-4 sm:px-6 lg:px-8">
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
            Votre plateforme juridique simplifiée.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/login?role=lawyer" passHref>
              <Card
                className="p-8 cursor-pointer shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary h-full flex flex-col justify-center"
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
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
             <Link href="/login?role=client" passHref>
              <Card
                className="p-8 cursor-pointer shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary h-full flex flex-col justify-center"
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
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
