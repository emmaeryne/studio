
import { getCases, getAppointments } from "@/lib/actions";
import { DashboardClientPage } from "@/components/dashboard-client-page";

export default async function DashboardPage() {
  const cases = await getCases();
  const appointments = await getAppointments();
  
  return <DashboardClientPage initialCases={cases} initialAppointments={appointments} />;
}
