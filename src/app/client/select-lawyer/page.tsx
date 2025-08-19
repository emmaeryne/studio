// src/app/client/select-lawyer/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAllLawyers, selectClientLawyer } from "@/lib/actions";
import type { Lawyer } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SelectLawyerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // If the user already has a lawyer, redirect them away from this page
    if (!loading && user && user.lawyerId) {
      router.push("/client/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchLawyers() {
      setIsLoading(true);
      const fetchedLawyers = await getAllLawyers();
      setLawyers(fetchedLawyers);
      setIsLoading(false);
    }
    fetchLawyers();
  }, []);

  const handleSelectLawyer = async (lawyerId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez être connecté pour choisir un avocat.",
      });
      return;
    }
    setIsSubmitting(lawyerId);
    const result = await selectClientLawyer(user.uid, lawyerId);
    if (result.success) {
      toast({
        title: "Avocat sélectionné !",
        description: "Vous allez être redirigé vers votre tableau de bord.",
      });
      // A hard reload is the most reliable way to force the AuthContext to get the new user data (with lawyerId)
      window.location.href = "/client/dashboard";
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.error || "Impossible de sélectionner cet avocat.",
      });
      setIsSubmitting(null);
    }
  };

  if (loading || isLoading || (user && user.lawyerId)) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Choisissez votre avocat
        </h1>
        <p className="text-muted-foreground mt-2">
          Sélectionnez un avocat pour vous accompagner dans vos démarches.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lawyers.map((lawyer) => (
          <Card key={lawyer.id} className="flex flex-col">
            <CardHeader className="items-center text-center">
              <Avatar className="h-20 w-20 mb-4 border-2 border-primary">
                <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                <AvatarFallback>{lawyer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline">{lawyer.name}</CardTitle>
              <CardDescription>{lawyer.specialty}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-center text-muted-foreground">
                {/* A placeholder for a future bio field */}
                Avocat expérimenté et dédié à la réussite de ses clients.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSelectLawyer(lawyer.id)}
                disabled={!!isSubmitting}
              >
                {isSubmitting === lawyer.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Choisir cet avocat
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
