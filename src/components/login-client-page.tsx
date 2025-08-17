// This component is created to house client-side logic for the login page,
// as the main page component is now a Server Component for authentication checks.
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Briefcase, User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { createUserProfile } from "@/lib/actions";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

// --- AuthDialog Logic is now defined directly in this file ---

const RegisterSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères pour plus de sécurité."),
});

const LoginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});


// --- Main LoginClientPage Component ---

export function LoginClientPage() {
  const [dialogRole, setDialogRole] = useState<'lawyer' | 'client' | null>(null);
  const searchParams = useSearchParams();

  // --- State and handlers from the former AuthDialog component ---
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'lawyer' || role === 'client') {
      setDialogRole(role);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogRole) return;
    setIsLoading(true);

    try {
      const validatedData = RegisterSchema.parse(formData);
      const userCredential = await createUserWithEmailAndPassword(auth, validatedData.email, validatedData.password);
      const user = userCredential.user;

      const profileResult = await createUserProfile(user.uid, validatedData.name, validatedData.email, dialogRole);
      if (!profileResult.success) {
        throw new Error(profileResult.error || "La création du profil utilisateur a échoué.");
      }
      
      await sendEmailVerification(user);
      
      toast({
        title: "Inscription réussie !",
        description: "Un email de vérification a été envoyé. Vous allez être connecté.",
      });
      setDialogRole(null);
    } catch (error) {
      let errorMessage = "Une erreur est survenue. Veuillez réessayer.";
      if (error instanceof z.ZodError) {
        errorMessage = error.errors[0].message;
      } else if (error instanceof Error) {
        if ('code' in error && typeof (error as any).code === 'string') {
            switch ((error as any).code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Cette adresse email est déjà utilisée.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Le mot de passe est trop faible.';
                    break;
                default:
                    errorMessage = (error as any).message || "Erreur lors de la création du compte.";
            }
        } else {
            errorMessage = error.message;
        }
      }
      toast({
        variant: "destructive",
        title: "Erreur d'inscription",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
        const validatedData = LoginSchema.parse(formData);
        await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        setDialogRole(null);
    } catch (error) {
       let errorMessage = "Une erreur est survenue. Veuillez réessayer.";
       if (error instanceof z.ZodError) {
         errorMessage = error.errors[0].message;
       } else if (error instanceof Error) {
            if ('code' in error && typeof (error as any).code === 'string') {
                switch ((error as any).code) {
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                case 'auth/invalid-credential':
                    errorMessage = 'Email ou mot de passe incorrect.';
                    break;
                default:
                    errorMessage = (error as any).message || "Erreur d'authentification.";
                }
            } else {
                errorMessage = error.message;
            }
       }
       toast({
         variant: "destructive",
         title: "Erreur de connexion",
         description: errorMessage,
       });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDialogRole(null);
      setFormData({ name: "", email: "", password: "" });
      setShowPassword(false);
    }
  };

  // Fallback to a neutral state if searchParams are not available initially
  if (!searchParams) {
    return null; 
  }

  return (
    <>
      <Dialog open={!!dialogRole} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="bg-primary/10 p-3 rounded-full mb-2">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="font-headline text-2xl">
              Espace {dialogRole === "lawyer" ? "Avocat" : "Client"}
            </DialogTitle>
            <DialogDescription>
              Accédez à votre tableau de bord sécurisé.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Se connecter</TabsTrigger>
              <TabsTrigger value="register">S'inscrire</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" name="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleInputChange} required disabled={isLoading} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                   <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleInputChange} required disabled={isLoading} className="pl-10 pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full font-semibold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Se connecter"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nom complet</Label>
                   <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="register-name" name="name" placeholder="Nom Prénom" value={formData.name} onChange={handleInputChange} required disabled={isLoading} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="register-email" name="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleInputChange} required disabled={isLoading} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="register-password" name="password" type={showPassword ? "text" : "password"} placeholder="8+ caractères" value={formData.password} onChange={handleInputChange} required disabled={isLoading} className="pl-10 pr-10" />
                     <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full font-semibold" disabled={isLoading}>
                   {isLoading ? <Loader2 className="animate-spin" /> : "Créer le compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-accent/10 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl text-center"
        >
          <div className="mb-8">
             <p className="text-sm text-muted-foreground mb-4">Développée par Emna Awini</p>
            <h1 className="text-4xl md:text-5xl font-headline font-bold">
              Bienvenue sur AvocatConnect
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Votre plateforme juridique simplifiée.
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
      </div>
    </>
  );
}
