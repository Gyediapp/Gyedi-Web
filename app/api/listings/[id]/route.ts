import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const UpdateListingSchema = z.object({
  title:       z.string().min(3).max(200).trim().optional(),
  description: z.string().min(10).max(5000).trim().optional(),
  price:       z.number().positive().optional(),
  category:    z.string().min(1).optional(),
  images:      z.array(z.string().url()).max(10).optional(),
});

async function verifyToken(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(
      auth.slice(7),
      new TextEncoder().encode(process.env.JWT_SECRET ?? ''),
    );
    return payload.sub as string;
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ listing });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await verifyToken(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, select: { sellerId: true, status: true } });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.sellerId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = UpdateListingSchema.safeParse(body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ listing: updated });
}
