
import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import { LoginClientPage } from "@/components/login-client-page";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/');
  }

  return <LoginClientPage />;
}
