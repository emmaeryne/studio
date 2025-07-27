
"use client";

import { useRouter } from "next/navigation";
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, User, LogIn, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loginUserByEmail, quickLogin, registerUser } from "@/lib/actions";
import { RegisterDialog } from "@/components/register-dialog";

const LoginSchema = z.object({
  email: z.string().email("Adresse email invalide").min(1, "L'email est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  role: z.enum(["lawyer", "client"]),
});

export default function LoginPage() {
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<"lawyer" | "client">("client");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleQuickLogin = async (role: "lawyer" | "client") => {
    setIsLoading(true);
    const result = await quickLogin(role);
    if (result.success && result.role) {
      toast({
        title: "Connexion réussie",
        description: `Connexion en tant que ${role === "lawyer" ? "avocat" : "client"}.`,
      });
      router.push(result.role === "lawyer" ? "/dashboard" : "/client/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.error,
      });
    }
    setIsLoading(false);
  };
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = LoginSchema.parse({ email, password, role });
      const result = await loginUserByEmail(validatedData);

      if (result.success && result.role) {
        toast({
          title: "Connexion réussie",
          description: `Connexion en tant que ${role === "lawyer" ? "avocat" : "client"}.`,
        });
        router.push(result.role === 'lawyer' ? '/dashboard' : '/client/dashboard');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof z.ZodError
          ? error.errors[0].message
          : (error as Error).message || "Échec de la connexion. Veuillez réessayer.";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-accent/10 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg border border-accent/20">
            <CardHeader className="text-center pt-6 items-center">
               <Image src="/logo.png" alt="AvocatConnect Logo" width={200} height={100} priority />
              <CardTitle className="text-2xl md:text-3xl font-headline font-bold pt-4">
                Bienvenue sur AvocatConnect
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Sélectionnez votre profil ou connectez-vous pour continuer.
              </CardDescription>
              <hr className="mt-4 border-accent/20 w-full" />
            </CardHeader>
            <CardContent className="grid gap-4">
              <AnimatePresence>
                {!showLoginForm ? (
                  <motion.div
                    key="role-selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-4"
                  >
                    <Button
                      size="lg"
                      className="w-full font-semibold bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-200"
                      disabled={isLoading}
                      onClick={() => handleQuickLogin("lawyer")}
                      aria-label="Se connecter en tant qu'avocat"
                    >
                      <Briefcase className="mr-2 h-5 w-5" />
                      Espace Avocat
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full font-semibold hover:bg-accent/10 hover:scale-105 transition-all duration-200"
                      disabled={isLoading}
                      onClick={() => handleQuickLogin("client")}
                      aria-label="Se connecter en tant que client"
                    >
                      <User className="mr-2 h-5 w-5" />
                      Espace Client
                    </Button>
                    <div className="flex justify-center items-center gap-2">
                        <Button
                        variant="link"
                        className="text-sm text-primary hover:underline"
                        onClick={() => setShowLoginForm(true)}
                        aria-label="Afficher le formulaire de connexion"
                        disabled={isLoading}
                        >
                        Connexion avec email
                        </Button>
                        <span className="text-muted-foreground">ou</span>
                         <RegisterDialog>
                            <Button variant="link" className="text-sm text-primary hover:underline p-0">
                                Créer un compte
                            </Button>
                        </RegisterDialog>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="login-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-4"
                    onSubmit={handleLoginSubmit}
                  >
                     <div className="grid gap-2">
                      <Label htmlFor="role" className="font-semibold">
                        Rôle
                      </Label>
                      <Select value={role} onValueChange={(value) => setRole(value as "lawyer" | "client")}>
                        <SelectTrigger id="role" aria-label="Sélectionner votre rôle">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lawyer">Avocat</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="font-semibold">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        aria-required="true"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password" className="font-semibold">
                        Mot de passe
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-required="true"
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full font-semibold hover:scale-105 transition-all duration-200"
                      disabled={isLoading || !email.trim() || !password.trim()}
                      aria-label="Se connecter"
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                            />
                          </svg>
                          Connexion...
                        </span>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-5 w-5" />
                          Se connecter
                        </>
                      )}
                    </Button>
                    <div className="flex justify-between">
                      <Button
                        variant="link"
                        className="text-sm text-primary hover:underline"
                        onClick={() => setShowLoginForm(false)}
                        aria-label="Retour à la sélection du profil"
                        disabled={isLoading}
                      >
                        Retour à la sélection du profil
                      </Button>
                       <RegisterDialog>
                            <Button variant="link" className="text-sm text-primary hover:underline p-0 h-auto">
                                <PlusCircle className="mr-1 h-4 w-4" /> Créer un compte
                            </Button>
                        </RegisterDialog>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
           <p className="text-center text-xs text-muted-foreground mt-4">
              Développé par Emna Awini
            </p>
        </motion.div>
      </div>
    </>
  );
}
