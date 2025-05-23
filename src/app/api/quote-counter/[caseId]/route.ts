// /app/api/quote-counter/[caseId]/route.ts

import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { caseId: string } }) {
  const { caseId } = params;

  try {
    const counter = await prisma.quoteCounter.upsert({
      where: { caseId },
      update: { count: { increment: 1 } },
      create: { caseId, count: 1 }
    });

    return NextResponse.json({ count: counter.count });
  } catch (error) {
    console.error("QuoteCounter failed:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
