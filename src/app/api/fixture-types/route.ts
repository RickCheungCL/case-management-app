// File: app/api/fixture-types/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Make sure to use the correct model name as defined in your schema
    const fixtureTypes = await prisma.lightFixtureType.findMany({
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(fixtureTypes);
  } catch (error) {
    console.error('Error fetching fixture types:', error);
    return NextResponse.json({ error: 'Failed to fetch fixture types' }, { status: 500 });
  }
}