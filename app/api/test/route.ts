import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasServiceKey:  !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasJwtSecret:   !!process.env.JWT_SECRET,
    keyLength:       process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    supabaseUrl:     process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) ?? '(not set)',
  });
}
