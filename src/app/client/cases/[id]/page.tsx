
import { getCaseById, getCases } from "@/lib/actions";
import { ClientCaseDetailPageContent } from "@/components/client-case-detail-page";
import { notFound } from "next/navigation";

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


export default async function ClientCaseDetailPage({ params }: { params: { id: string }}) {
  const { id } = params;
  const caseItem = await getCaseById(id);

  if (!caseItem) {
    notFound();
  }

  return <ClientCaseDetailPageContent initialCase={caseItem} />;
}
