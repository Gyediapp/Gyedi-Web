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
  condition:   z.string().optional(),
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

const LISTING_SELECT = {
  id: true, title: true, description: true, price: true,
  category: true, images: true, sellerId: true,
  country: true, status: true, storeType: true,
  views: true, condition: true, createdAt: true, updatedAt: true,
  seller: { select: { id: true, firstName: true, lastName: true } },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: LISTING_SELECT,
    });
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ listing });
  } catch (err) {
    console.error('[GET /api/listings/:id] Prisma error:', err);
    return NextResponse.json({ error: 'Database error loading listing' }, { status: 500 });
  }
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

  let updated;
  try {
    updated = await prisma.listing.update({
      where: { id },
      data: parsed.data,
      select: LISTING_SELECT,
    });
  } catch (err) {
    console.error('[PATCH /api/listings/:id] Prisma error:', err);
    return NextResponse.json({ error: 'Database error saving listing' }, { status: 500 });
  }

  return NextResponse.json({ listing: updated });
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await verifyToken(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, select: { sellerId: true } });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.sellerId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await prisma.listing.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/listings/:id] Prisma error:', err);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
