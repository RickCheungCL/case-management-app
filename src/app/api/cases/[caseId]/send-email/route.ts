import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PassThrough } from 'stream';
import archiver from 'archiver';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import axios from 'axios';
import { Resend } from 'resend';
import CaseReportPDF from '@/app/(protected)/components/CaseReportPDF';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/authOptions';// adjust path as needed


const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  context: { params: { caseId: string } }
) {
  const { caseId } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const currentUserEmail = session.user.email;
  try {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        user: { select: { email: true, name: true } },
        documents: true,
        photos: true,
        fixtureCounts: { include: { fixtureType: true } },
        installationDetail: {
          include: { tags: { include: { tag: true } } },
        },
        onSiteVisit: {
          include: {
            rooms: {
              include: {
                locationTag: true,
                existingLights: { include: { product: true } },
                suggestedLights: true,
                photos: {
                  include: {
                    tags: { include: { tag: true } },
                  },
                },
              },
            },
          },
        },
        activityLogs: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caseData || !caseData.user?.email) {
      return new Response('Case or user email not found', { status: 404 });
    }

    // 1. Render PDF to buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(CaseReportPDF, { caseData })
    );

    // 2. Create zip in memory
    const zipStream = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(zipStream);

    archive.append(pdfBuffer, { name: 'case-report.pdf' });

    // Add documents
    for (const doc of caseData.documents || []) {
      const buffer = await fetchFile(doc.url);
      archive.append(buffer, { name: `documents/${doc.fileName}` });
    }

    // Add top-level photos
    for (const photo of caseData.photos || []) {
      const buffer = await fetchFile(photo.url);
      archive.append(buffer, {
        name: `photos/${photo.customName || `photo-${photo.id}`}.jpg`,
      });
    }

    // Add on-site visit photos
    for (const room of caseData.onSiteVisit?.rooms || []) {
      for (const photo of room.photos || []) {
        const buffer = await fetchFile(photo.url);
        archive.append(buffer, {
          name: `onsite-photos/${photo.id}.jpg`,
        });
      }
    }

    await archive.finalize();

    // Convert zip stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of zipStream) chunks.push(chunk);
    const zipBuffer = Buffer.concat(chunks);
    console.log('🔐 RESEND_API_KEY loaded:', Boolean(process.env.RESEND_API_KEY));

    // 3. Send email via Resend
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: currentUserEmail,
      subject: `Case Report – ${caseId} - ${caseData.customerName}`,
      html: `<p>Hello,</p>
             <p>Your report for Case <strong>${caseId} - ${caseData.customerName}</strong> is attached as a ZIP file.</p>
             <p>Thank you.</p>`,
      attachments: [
        {
          filename: `Case-${caseId}- ${caseData.customerName}.zip`,
          content: zipBuffer.toString('base64'),
        },
      ],
    });
    console.log('📤 Sending to:', currentUserEmail);
    console.log('📎 Attachment size:', zipBuffer.length, 'bytes');
    return new Response(JSON.stringify({ success: true, messageId: response.id }), {
      

      status: 200,
    });
  } catch (err) {
    console.error('Error generating report email:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function fetchFile(url: string): Promise<Buffer> {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  } catch (error) {
    console.error('Failed to fetch file:', url, error);
    return Buffer.from(''); // Empty placeholder
  }
}
