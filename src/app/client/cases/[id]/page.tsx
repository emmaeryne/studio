
import { getCaseById } from "@/lib/actions";
import { ClientCaseDetailPageContent } from "@/components/client-case-detail-page";
import { notFound } from "next/navigation";

export default async function ClientCaseDetailPage({ params }: { params: { id: string }}) {
  const { id } = params;
  const caseItem = await getCaseById(id);

  if (!caseItem) {
    notFound();
  }

  return <ClientCaseDetailPageContent initialCase={caseItem} />;
}
