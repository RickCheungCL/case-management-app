// File: app/api/tags/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tags = await prisma.installationTag.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
      const { name } = await req.json();
      
      if (!name || name.trim() === '') {
        return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
      }
  
      // Check if tag already exists (case insensitive)
      const existingTag = await prisma.installationTag.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive'
          }
        }
      });
  
      if (existingTag) {
        return NextResponse.json({ error: 'Tag already exists', tag: existingTag }, { status: 400 });
      }
  
      // Create new tag
      const newTag = await prisma.installationTag.create({
        data: { name }
      });
  
      return NextResponse.json(newTag);
    } catch (error) {
      console.error('Error creating tag:', error);
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }
  }