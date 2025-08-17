// src/app/login/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoginClientPage } from "@/components/login-client-page";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'lawyer') {
        router.push('/dashboard');
      } else {
        router.push('/client/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
       <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2 text-muted-foreground">Redirection...</p>
      </div>
    );
  }

  return <LoginClientPage />;
}
