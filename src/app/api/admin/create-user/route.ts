import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, name, password, role } = body;

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[Create User Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}