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
import { user } from "@/lib/data";
import { User, Mail, Building } from "lucide-react";

export default function ProfilePage() {
  const lawyer = user.lawyer;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Profil</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
              <AvatarFallback className="text-3xl">
                {lawyer.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold font-headline">{lawyer.name}</h2>
              <p className="text-muted-foreground">{lawyer.role}</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4"/>
                    <span>{lawyer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Building className="h-4 w-4"/>
                    <span>Cabinet Légal & Associés</span>
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
                <Input id="fullName" defaultValue={lawyer.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input id="email" type="email" defaultValue={lawyer.email} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Input id="role" defaultValue={lawyer.role} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Spécialité</Label>
              <Input id="specialty" defaultValue="Droit de la famille, Droit pénal" />
            </div>
             <div className="flex justify-end pt-2">
                <Button>Enregistrer les modifications</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
