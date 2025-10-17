// app/api/cases/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';

const prisma = new PrismaClient();

// Add API key check
function checkApiKey(request: Request): boolean {
  const apiKey = request.headers.get('X-API-Key');
  return apiKey === process.env.FLUTTER_API_KEY; // Set this in your .env
}

export async function GET(request: Request) {
  // Check for API key (for Flutter app)
  if (checkApiKey(request)) {
    try {
      const cases = await prisma.case.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          customerName: true,
          projectDetails: true,
          contactPerson: true,
          schoolName: true,
          emailAddress: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      return NextResponse.json(cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
      return NextResponse.json({ error: 'Error fetching cases' }, { status: 500 });
    }
  }

  // Otherwise check session (for web app)
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... rest of your existing code
}