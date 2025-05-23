import QuotationPage from "./QuotationPage";

export default function QuotationWrapper({ params }: { params: { caseId: string } }) {
  return <QuotationPage caseId={params.caseId} />;
}
