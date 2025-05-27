import { NextRequest } from 'next/server';
import { PassThrough } from 'stream';
import archiver from 'archiver';
import { renderToStream } from '@react-pdf/renderer';
import CaseReportPDF from '@/app/(protected)/components/CaseReportPDF';

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import React from 'react';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: { caseId: string } }
) {
  const { caseId } = context.params;

  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
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
      user: true,
      activityLogs: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!caseData) {
    return new Response('Case not found', { status: 404 });
  }

  const zipStream = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(zipStream);

  // 1. Generate PDF
  const pdfStream = await renderToStream(
    React.createElement(CaseReportPDF, { caseData })
  );
  archive.append(pdfStream, { name: 'case-report.pdf' });

  // 2. Add documents
  for (const doc of caseData.documents || []) {
    const buffer = await fetchFile(doc.url);
    archive.append(buffer, { name: `documents/${doc.fileName}` });
  }

  // 3. Add top-level photos
  for (const photo of caseData.photos || []) {
    const buffer = await fetchFile(photo.url);
    archive.append(buffer, {
      name: `photos/${photo.customName || `photo-${photo.id}`}.jpg`,
    });
  }

  // 4. Add on-site visit photos
  for (const room of caseData.onSiteVisit?.rooms || []) {
    for (const photo of room.photos || []) {
      const buffer = await fetchFile(photo.url);
      archive.append(buffer, {
        name: `onsite-photos/${photo.id}.jpg`,
      });
    }
  }

  await archive.finalize();

  return new Response(zipStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="Case-${caseId}.zip"`,
    },
  });
}

async function fetchFile(url: string): Promise<Buffer> {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  } catch (error) {
    console.error(`Failed to fetch file from ${url}`, error);
    return Buffer.from('Failed to fetch file'); // or skip
  }
}

