import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import { HomeClientPage } from "@/components/home-client-page";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === 'lawyer') {
      redirect('/dashboard');
    } else {
      redirect('/client/dashboard');
    }
  }

  return <HomeClientPage />;
}
