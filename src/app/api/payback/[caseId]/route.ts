// /app/api/payback/[caseId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: { caseId: string };
}

// GET: fetch saved cost by caseId
export async function GET(req: Request, { params }: Params) {
  const { caseId } =await params;

  const setting = await prisma.paybackSetting.findUnique({
    where: { caseId },
  });

  return NextResponse.json(setting);
}

// POST: update or create cost by caseId
export async function POST(req: Request, { params }: Params) {
  const { caseId } =await params;
  const body = await req.json();
  const { value } =await body;

  if (typeof value !== "number") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const saved = await prisma.paybackSetting.upsert({
    where: { caseId },
    update: { value },
    create: { caseId, value },
  });

  return NextResponse.json(saved);
}
