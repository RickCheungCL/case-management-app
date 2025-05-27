'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function SendReportButton({ caseId }: { caseId: string }) {
  const [sending, setSending] = useState(false);

  const handleSendEmail = async () => {
    setSending(true);
    const toastId = toast.loading('Sending email...');

    try {
      const res = await fetch(`/api/cases/${caseId}/send-email`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('📨 Email sent successfully!', { id: toastId });
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to send email.', { id: toastId });
      }
    } catch (err) {
      toast.error('Something went wrong.', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={handleSendEmail}
      disabled={sending}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {sending ? 'Sending...' : 'Send Report to User'}
    </button>
  );
}
