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
import { updateClientProfile } from "@/lib/actions";
import { user as initialUser } from "@/lib/data";
import { User, Mail, Phone, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientProfilePage() {
  const [client, setClient] = useState(initialUser.currentUser);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    const res = await updateClientProfile(client);
    if(res.success) {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès."
      });
      router.refresh();
    } else {
       toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le profil."
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Mon Profil</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={client.avatar} alt={client.name} />
              <AvatarFallback className="text-3xl">
                {client.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold font-headline">{client.name}</h2>
              <p className="text-muted-foreground">Client</p>
            </div>
             <div className="text-sm text-muted-foreground space-y-1 text-left">
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4"/>
                    <span>{client.email}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4"/>
                    <span>{client.phone || "Non renseigné"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Home className="h-4 w-4"/>
                    <span>{client.address || "Non renseigné"}</span>
                </div>
            </div>
            <Button variant="outline">Changer la photo</Button>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Informations Personnelles</CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles ici.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input id="fullName" value={client.name} onChange={(e) => setClient({...client, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input id="email" type="email" value={client.email} onChange={(e) => setClient({...client, email: e.target.value})}/>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" value={client.phone || ''} onChange={(e) => setClient({...client, phone: e.target.value})} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input id="address" value={client.address || ''} onChange={(e) => setClient({...client, address: e.target.value})} />
                </div>
            </div>
            
             <div className="flex justify-end pt-2">
                <Button onClick={handleSave}>Enregistrer les modifications</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
