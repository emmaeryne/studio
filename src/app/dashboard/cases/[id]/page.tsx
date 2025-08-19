
import { getCaseById } from "@/lib/actions";
import { notFound } from "next/navigation";
import { LawyerCaseDetailPageContent } from "@/components/lawyer-case-detail-page";

export default async function CaseDetailPage({ params }: { params: { id: string }}) {
  const { id } = params;
  const caseItem = await getCaseById(id);

  if (!caseItem) {
    notFound();
  }

  return <LawyerCaseDetailPageContent initialCase={caseItem} />;
}
