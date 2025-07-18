import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, User } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">
            Bienvenue sur AvocatConnect
          </CardTitle>
          <CardDescription>
            Veuillez sélectionner votre profil pour continuer.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">
              <Briefcase className="mr-2 h-5 w-5" />
              Espace Avocat
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/client/dashboard">
              <User className="mr-2 h-5 w-5" />
              Espace Client
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
