import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('ids') ?? '';
  const ids = raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20);

  if (!ids.length) return NextResponse.json([]);

  try {
    const listings = await prisma.listing.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      select: { id: true, title: true, price: true, images: true, category: true },
    });
    return NextResponse.json(listings);
  } catch {
    return NextResponse.json([]);
  }
}
