"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createSessionCookie, createUserProfile } from "@/lib/actions";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { Loader2 } from "lucide-react";

interface AuthDialogProps {
  role: "lawyer" | "client" | null;
  isOpen: boolean;
  onClose: () => void;
}

const RegisterSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const LoginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export function AuthDialog({ role, isOpen, onClose }: AuthDialogProps) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setIsLoading(true);

    try {
      const validatedData = RegisterSchema.parse(formData);
      const userCredential = await createUserWithEmailAndPassword(auth, validatedData.email, validatedData.password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Create user profile in Firestore
      const profileResult = await createUserProfile(user.uid, validatedData.name, validatedData.email, role);
      if (!profileResult.success) throw new Error(profileResult.error);

      // Get ID token and create session
      const idToken = await user.getIdToken(true);
      const sessionResult = await createSessionCookie(idToken);
      if (!sessionResult.success) throw new Error(sessionResult.error);

      toast({
        title: "Inscription réussie !",
        description: "Un email de vérification a été envoyé. Vous allez être redirigé.",
      });

      router.push(role === "lawyer" ? "/dashboard" : "/client/dashboard");
      onClose();

    } catch (error) {
      let errorMessage = "Une erreur est survenue.";
      if (error instanceof z.ZodError) {
        errorMessage = error.errors[0].message;
      } else if (error instanceof Error && 'code' in error) {
        switch ((error as any).code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Cette adresse email est déjà utilisée.';
            break;
          default:
            errorMessage = 'Erreur lors de la création du compte.';
            console.error(error);
        }
      }
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setIsLoading(true);
    
    try {
        const validatedData = LoginSchema.parse(formData);
        const userCredential = await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        const user = userCredential.user;

        const idToken = await user.getIdToken(true);
        const sessionResult = await createSessionCookie(idToken);
        if (!sessionResult.success) throw new Error(sessionResult.error);

        toast({
          title: "Connexion réussie",
          description: "Vous allez être redirigé.",
        });
        
        router.push(role === "lawyer" ? "/dashboard" : "/client/dashboard");
        onClose();

    } catch (error) {
       let errorMessage = "Une erreur est survenue.";
       if (error instanceof z.ZodError) {
         errorMessage = error.errors[0].message;
       } else if (error instanceof Error && 'code' in error) {
         switch ((error as any).code) {
           case 'auth/wrong-password':
           case 'auth/user-not-found':
           case 'auth/invalid-credential':
             errorMessage = 'Email ou mot de passe incorrect.';
             break;
           default:
             errorMessage = "Erreur d'authentification.";
             console.error(error);
         }
       }
       toast({
         variant: "destructive",
         title: "Erreur",
         description: errorMessage,
       });
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({ name: "", email: "", password: "" });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Espace {role === "lawyer" ? "Avocat" : "Client"}
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
                <Input id="login-email" name="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleInputChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <Input id="login-password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required disabled={isLoading} />
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
                <Input id="register-name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input id="register-email" name="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleInputChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Mot de passe</Label>
                <Input id="register-password" name="password" type="password" placeholder="6+ caractères" value={formData.password} onChange={handleInputChange} required disabled={isLoading} />
              </div>
              <Button type="submit" size="lg" className="w-full font-semibold" disabled={isLoading}>
                 {isLoading ? <Loader2 className="animate-spin" /> : "Créer le compte"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
