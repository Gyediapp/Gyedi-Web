import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const CreateListingSchema = z.object({
  title:       z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(5000).trim(),
  price:       z.number().positive(),
  category:    z.string().min(1),
  images:      z.array(z.string().url()).max(10).default([]),
  condition:   z.string().default('New'),
});

async function verifyToken(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token  = auth.slice(7);
  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.sub as string;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateListingSchema.safeParse(body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { country: true } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let listing;
  try {
    listing = await prisma.listing.create({
      data: {
        ...parsed.data,
        sellerId:  userId,
        country:   user.country,
        storeType: 'BASIC',
        condition: parsed.data.condition,
      },
    });
  } catch (err: any) {
    console.error('[listings] create error:', err?.message ?? err);
    return NextResponse.json(
      { error: 'Failed to save listing — please try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ listing }, { status: 201 });
}

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { seller: { select: { firstName: true, lastName: true } } },
  });
  return NextResponse.json({ listings });
}
