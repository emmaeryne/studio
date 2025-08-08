
import { getCaseById, getCases } from "@/lib/actions";
import { notFound } from "next/navigation";
import { LawyerCaseDetailPageContent } from "@/components/lawyer-case-detail-page";

// This function is required for static export of dynamic routes.
// It tells Next.js which case pages to generate at build time.
export async function generateStaticParams() {
    const cases = await getCases();

    if (!cases || cases.length === 0) {
        return [];
    }
 
    return cases.map((caseItem) => ({
        id: caseItem.id,
    }));
}

export default async function CaseDetailPage({ params }: { params: { id: string }}) {
  const { id } = params;
  const caseItem = await getCaseById(id);

  if (!caseItem) {
    notFound();
  }

  return <LawyerCaseDetailPageContent initialCase={caseItem} />;
}
