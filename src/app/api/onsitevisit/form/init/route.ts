import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('caseId');

  if (!caseId) {
    return new Response(JSON.stringify({ error: 'Case ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Find or create OnSiteVisit with nested data
    let visit = await prisma.onSiteVisit.findUnique({
      where: { caseId },
      include: {
        rooms: {
          include: {
            photos: {
              include: {
                tags: {
                  include: {
                    tag: true
                  }
                }
              }
            },
            suggestedLights: true,
            existingLights: { // This matches your Prisma schema (OnSiteExistingProduct[])
              include: {
                product: true
              }
            },
            locationTag: true
          }
        }
      }
    });

    // Create a default OnSiteVisit if none exists
    if (!visit) {
      visit = await prisma.onSiteVisit.create({
        data: {
          caseId,
          rooms: {
            create: [{
              location: 'Default Room',
              lightingIssue: '',
              customerRequest: '',
              mountingKitQty: 0,
              motionSensorQty: 0
            }]
          }
        },
        include: {
          rooms: {
            include: {
              photos: {
                include: {
                  tags: {
                    include: {
                      tag: true
                    }
                  }
                }
              },
              suggestedLights: true,
              existingLights: {
                include: {
                  product: true
                }
              },
              locationTag: true
            }
          }
        }
      });
    }

    return new Response(JSON.stringify(visit), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in OnSiteVisit form init API:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch or create OnSiteVisit' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}