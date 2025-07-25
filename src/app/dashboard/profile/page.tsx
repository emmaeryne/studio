"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { updateLawyerProfile, getLawyerProfile } from "@/lib/actions";
import { staticUserData, Lawyer } from "@/lib/data";
import { User, Mail, Building, Phone, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

type Errors = {
  name?: string;
  email?: string;
};

export default function ProfilePage() {
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errors, setErrors] = useState<Errors>({});
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLawyer = async () => {
        const profile = await getLawyerProfile(staticUserData.lawyer.id);
        setLawyer(profile);
    }
    fetchLawyer();
  }, []);

  // Form validation
  const validateForm = () => {
    if (!lawyer) return false;
    const newErrors: Errors = {};
    if (!lawyer.name.trim()) newErrors.name = "Le nom complet est requis.";
    if (!lawyer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lawyer.email))
      newErrors.email = "Veuillez entrer un e-mail valide.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !lawyer) return;
    const file = files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez sélectionner une image valide (PNG, JPG).",
        });
        return;
      }
      setAvatarFile(file);
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const newAvatarUrl = URL.createObjectURL(file);
          setLawyer({ ...lawyer, avatar: newAvatarUrl });
          setUploadProgress(0);
          toast({
            title: "Photo mise à jour",
            description: "Votre photo de profil a été chargée avec succès.",
          });
        }
      }, 200);
    }
  };

  // Handle form submission
  const handleSave = async () => {
    if (!lawyer || !validateForm()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez corriger les erreurs dans le formulaire.",
      });
      return;
    }
    const res = await updateLawyerProfile(lawyer);
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
        description: "Impossible de mettre à jour le profil.",
      });
    }
  };
  
  if (!lawyer) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-headline font-bold mb-6">
        Profil de l'Avocat
      </h1>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lawyer Info Card */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-primary shadow-md">
                <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                <AvatarFallback className="text-3xl bg-gradient-to-r from-primary to-secondary text-white">
                  {lawyer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                aria-label="Changer la photo de profil"
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
              <h2 className="text-xl font-bold font-headline">{lawyer.name}</h2>
              <p className="text-muted-foreground text-sm">{lawyer.role}</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{lawyer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>Cabinet Légal & Associés</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{lawyer.phone || "Non spécifié"}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full max-w-xs"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              Changer la photo
            </Button>
          </CardContent>
        </Card>

        {/* Personal Information Form */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              Informations Personnelles
            </CardTitle>
            <CardDescription>
              Mettez à jour vos informations pour une meilleure gestion de votre profil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={lawyer.name}
                  onChange={(e) =>
                    setLawyer({ ...lawyer, name: e.target.value })
                  }
                  className={errors.name ? "border-red-500" : ""}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-red-500 text-sm">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={lawyer.email}
                  onChange={(e) =>
                    setLawyer({ ...lawyer, email: e.target.value })
                  }
                  className={errors.email ? "border-red-500" : ""}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-red-500 text-sm">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Input id="role" value={lawyer.role} disabled className="bg-gray-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Spécialité</Label>
              <Select
                value={lawyer.specialty || "Droit de la famille"}
                onValueChange={(value) => setLawyer({ ...lawyer, specialty: value })}
              >
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Sélectionnez une spécialité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Droit de la famille">Droit de la famille</SelectItem>
                  <SelectItem value="Droit pénal">Droit pénal</SelectItem>
                  <SelectItem value="Droit des affaires">Droit des affaires</SelectItem>
                  <SelectItem value="Droit immobilier">Droit immobilier</SelectItem>
                  <SelectItem value="Droit du travail">Droit du travail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={lawyer.phone || ""}
                onChange={(e) => setLawyer({ ...lawyer, phone: e.target.value })}
                placeholder="+216 12 345 678"
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setLawyer(staticUserData.lawyer)}
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
