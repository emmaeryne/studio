"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateClientProfile } from "@/lib/actions";
import { type Client } from "@/lib/data";
import { Mail, Phone, Home, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";

export default function ClientProfilePage() {
  const { user, loading } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [initialClient, setInitialClient] = useState<Client | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    if (user) {
        const clientData = {
            id: user.uid,
            name: user.name,
            email: user.email || '',
            avatar: user.avatar,
            // These fields would be fetched from Firestore in a real app if they existed
            phone: (user as any).phone || '',
            address: (user as any).address || '',
        };
        setClient(clientData);
        setInitialClient(clientData);
    }
  }, [user])

  const validateForm = () => {
    if (!client) return false;
    const newErrors: typeof errors = {};
    if (!client.name.trim()) newErrors.name = "Nom requis.";
    if (!client.email.trim()) newErrors.email = "Email requis.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Fichier invalide",
        description: "Veuillez choisir une image (PNG, JPG, etc.).",
      });
      return;
    }

    setAvatarFile(file);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        const newAvatar = URL.createObjectURL(file);
        setClient({ ...client, avatar: newAvatar });
        toast({
          title: "Photo mise à jour",
          description: "Votre photo de profil a été changée.",
        });
        setUploadProgress(0);
      }
    }, 150);
  };

  const handleSave = async () => {
    if (!client || !validateForm()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez corriger les champs invalides.",
      });
      return;
    }

    const res = await updateClientProfile(client.id, client);

    if (res.success) {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la mise à jour du profil.",
      });
    }
  };

  if (loading || !client) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-headline font-bold mb-6">
        Mon Profil
      </h1>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar Card */}
        <Card className="lg:col-span-1 shadow-md">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={client.avatar} alt={client.name} />
                <AvatarFallback className="text-3xl">
                  {client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="w-3/4" />
            )}
            <div>
              <h2 className="text-xl font-bold font-headline">{client.name}</h2>
              <p className="text-muted-foreground">Client</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 text-left">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{client.phone || "Non renseigné"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>{client.address || "Non renseigné"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Form */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              Informations Personnelles
            </CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles ici.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={client.name}
                  onChange={(e) =>
                    setClient({ ...client, name: e.target.value })
                  }
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={client.email}
                  onChange={(e) =>
                    setClient({ ...client, email: e.target.value })
                  }
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={client.phone || ""}
                  onChange={(e) =>
                    setClient({ ...client, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={client.address || ""}
                  onChange={(e) =>
                    setClient({ ...client, address: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setClient(initialClient)}
              >
                Annuler
              </Button>
              <Button onClick={handleSave}>Enregistrer les modifications</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
