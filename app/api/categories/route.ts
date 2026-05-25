import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_CATEGORIES = [
  'Electronics', 'Fashion', 'Vehicles', 'Furniture',
  'Services', 'Agriculture', 'Real Estate', 'Other',
];

export async function GET() {
  try {
    const row = await (prisma as any).feeConfig.findUnique({
      where: { key: 'marketplace_categories' },
    });
    if (row) {
      const cats = JSON.parse(row.value);
      if (Array.isArray(cats) && cats.length > 0) {
        return NextResponse.json({ categories: cats });
      }
    }
  } catch {}
  return NextResponse.json({ categories: DEFAULT_CATEGORIES });
}
