"use client";

import { useState } from "react";
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
import { Loader2, Mail, Lock, User, Eye, EyeOff, Briefcase } from "lucide-react";

interface AuthDialogProps {
  role: "lawyer" | "client" | null;
  isOpen: boolean;
  onClose: () => void;
}

const RegisterSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères pour plus de sécurité."),
});

const LoginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const AuthDialog = ({ role, isOpen, onClose }: AuthDialogProps) => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { toast } = useToast();

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

      const profileResult = await createUserProfile(user.uid, validatedData.name, validatedData.email, role);
      if (!profileResult.success) {
        throw new Error(profileResult.error || "La création du profil utilisateur a échoué.");
      }
      
      await sendEmailVerification(user);
      
      toast({
        title: "Inscription réussie !",
        description: "Un email de vérification a été envoyé. Vous allez être connecté.",
      });
      onClose();
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
        onClose();
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
      setFormData({ name: "", email: "", password: "" });
      setShowPassword(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="bg-primary/10 p-3 rounded-full mb-2">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
  );
};
