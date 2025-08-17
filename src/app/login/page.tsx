
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createSessionCookie, createUserProfile } from "@/lib/actions";
import { auth } from "@/lib/firebase";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    sendEmailVerification
} from "firebase/auth";

const RegisterSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(["lawyer", "client"]),
});

const LoginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "client" as "client" | "lawyer" });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: "client" | "lawyer") => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "register") {
        const validatedData = RegisterSchema.parse(formData);
        const userCredential = await createUserWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        const user = userCredential.user;
        
        // Send verification email (optional but recommended)
        await sendEmailVerification(user);
        
        // Create user profile in Firestore
        await createUserProfile(user.uid, validatedData.name, validatedData.email, validatedData.role);

        // Get ID token and create session
        const idToken = await user.getIdToken(true);
        await createSessionCookie(idToken);
        
        toast({
          title: "Inscription réussie !",
          description: "Un email de vérification a été envoyé. Vous allez être redirigé.",
        });

        router.push(validatedData.role === "lawyer" ? "/dashboard" : "/client/dashboard");

      } else { // Login mode
        const validatedData = LoginSchema.parse(formData);
        const userCredential = await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        const user = userCredential.user;

        // Get ID token and create session
        const idToken = await user.getIdToken(true);
        const sessionResult = await createSessionCookie(idToken);
        if (!sessionResult.success) throw new Error(sessionResult.error);

        toast({
          title: "Connexion réussie",
          description: "Vous allez être redirigé.",
        });
        
        // We don't know the role on the client, so we redirect and let the middleware/layout handle it.
        // A temporary redirect to a generic loading page might be good here in a real app.
        router.push('/dashboard'); // Let middleware sort out lawyer vs client
      }
    } catch (error) {
        let errorMessage = "Une erreur est survenue.";
        if (error instanceof z.ZodError) {
            errorMessage = error.errors[0].message;
        } else if (error instanceof Error && 'code' in error) {
            switch ((error as any).code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Cette adresse email est déjà utilisée.';
                    break;
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                     errorMessage = 'Email ou mot de passe incorrect.';
                     break;
                default:
                     errorMessage = 'Erreur d\'authentification.';
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-accent/10 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg border border-accent/20">
          <CardHeader className="text-center pt-6 items-center">
            <CardTitle className="text-2xl md:text-3xl font-headline font-bold pt-4">
              Bienvenue sur AvocatConnect
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === 'login' ? 'Connectez-vous à votre compte.' : 'Créez un nouveau compte.'}
            </CardDescription>
            <hr className="mt-4 border-accent/20 w-full" />
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="grid gap-4"
                onSubmit={handleFormSubmit}
              >
                {mode === "register" && (
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isLoading} />
                    </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleInputChange} required disabled={isLoading} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required disabled={isLoading} />
                </div>
                {mode === "register" && (
                  <div className="grid gap-2">
                    <Label htmlFor="role">Je suis un</Label>
                    <Select name="role" required value={formData.role} onValueChange={handleRoleChange} disabled={isLoading}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="lawyer">Avocat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" size="lg" className="w-full font-semibold" disabled={isLoading}>
                  {isLoading ? "Chargement..." : (mode === "login" ? "Se connecter" : "Créer le compte")}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  disabled={isLoading}
                >
                  {mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
                </Button>
              </motion.form>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
