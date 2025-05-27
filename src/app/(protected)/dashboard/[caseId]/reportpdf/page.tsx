'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import CaseReportPDF from '../../../components/CaseReportPDF';

export default function CasePDFPage() {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId || typeof caseId !== 'string') return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}/report-data`);
        const data = await res.json();
        setCaseData(data);
      } catch (err) {
        console.error('Failed to fetch case data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [caseId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!caseData) return <div className="p-6 text-red-500">Case not found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Case Report for {caseId}</h1>

      <PDFDownloadLink
        document={<CaseReportPDF caseData={caseData} />}
        fileName={`case-${caseId}-report.pdf`}
      >
        {({ loading }) => (loading ? 'Generating PDF...' : '📄 Download PDF')}
      </PDFDownloadLink>
    </div>
  );
}
