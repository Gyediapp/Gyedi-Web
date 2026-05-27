import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const MAX_SIZE      = 5 * 1024 * 1024;
const ALLOWED       = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const VALID_BUCKETS = new Set(['listings', 'banners']);

// ── env-var diagnostic ────────────────────────────────────────────────────────
export async function GET() {
  return Response.json({
    hasServiceKey:  !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasJwtSecret:   !!process.env.JWT_SECRET,
    keyLength:       process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) ?? '(not set)',
  });
}

// ── auth ──────────────────────────────────────────────────────────────────────
async function verifyToken(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(
      auth.slice(7),
      new TextEncoder().encode(process.env.JWT_SECRET ?? ''),
    );
    return payload.sub as string;
  } catch (err) {
    console.error('[upload] JWT verify failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ── upload helper (lazy — reads env at call time, not module init) ─────────────
async function uploadToSupabase(
  bucket: string,
  path: string,
  buffer: ArrayBuffer,
  contentType: string,
): Promise<{ publicUrl: string } | { error: string; status: number }> {
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[upload] env check — supabaseUrl:', supabaseUrl?.slice(0, 40), 'keyLength:', serviceRoleKey?.length ?? 0);

  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    console.error('[upload] NEXT_PUBLIC_SUPABASE_URL is missing or placeholder');
    return { error: 'Supabase URL not configured', status: 500 };
  }
  if (!serviceRoleKey || serviceRoleKey === 'placeholder') {
    console.error('[upload] SUPABASE_SERVICE_ROLE_KEY is missing or placeholder');
    return { error: 'Upload service key not configured — contact support', status: 500 };
  }

  // Use the Supabase Storage REST API directly so we don't risk stale module-level client
  const endpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
  console.log('[upload] POST to Storage endpoint:', endpoint.slice(0, 80));

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${serviceRoleKey}`,
        'Content-Type': contentType,
        'x-upsert':     'true',
      },
      body: buffer,
    });
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    console.error('[upload] fetch to Supabase Storage threw:', msg);
    return { error: `Network error reaching storage: ${msg}`, status: 502 };
  }

  console.log('[upload] Supabase Storage response status:', res.status);

  if (!res.ok) {
    let errMsg = `Storage returned ${res.status}`;
    try {
      const body = await res.json() as Record<string, unknown>;
      console.error('[upload] Supabase error body:', JSON.stringify(body));
      if (typeof body.error === 'string')   errMsg = body.error;
      else if (typeof body.message === 'string') errMsg = body.message;
    } catch {
      const txt = await res.text().catch(() => '');
      console.error('[upload] Supabase raw error text:', txt.slice(0, 300));
      if (txt) errMsg = txt.slice(0, 200);
    }
    return { error: errMsg, status: res.status >= 400 && res.status < 600 ? res.status : 500 };
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  return { publicUrl };
}

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('[upload] POST received');

  const userId = await verifyToken(req);
  if (!userId) {
    console.error('[upload] Auth failed — no valid userId from token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[upload] Authenticated userId:', userId);

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch (err) {
    console.error('[upload] Failed to parse formData:', err);
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const bucket = (fd.get('bucket') as string | null) ?? 'listings';
  console.log('[upload] bucket:', bucket);
  if (!VALID_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  // ── Single-file mode ──
  const singleFile = fd.get('file') as File | null;
  if (singleFile) {
    console.log('[upload] single-file mode — name:', singleFile.name, 'size:', singleFile.size, 'type:', singleFile.type);

    if (!ALLOWED.has(singleFile.type)) {
      return NextResponse.json({ error: 'Unsupported type. Use JPG, PNG or WebP.' }, { status: 400 });
    }
    if (singleFile.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 5 MB limit.' }, { status: 400 });
    }

    const ext    = singleFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path   = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = await singleFile.arrayBuffer();

    const result = await uploadToSupabase(bucket, path, buffer, singleFile.type);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    console.log('[upload] success — publicUrl:', result.publicUrl.slice(0, 80));
    return NextResponse.json({ publicUrl: result.publicUrl });
  }

  // ── Multi-file mode ──
  const files = fd.getAll('files') as File[];
  console.log('[upload] multi-file mode — count:', files.length);
  if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  if (files.length > 5) return NextResponse.json({ error: 'Max 5 images' }, { status: 400 });

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: `${file.name}: unsupported type. Use JPG, PNG or WebP.` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${file.name}: exceeds 5 MB limit.` }, { status: 400 });
    }

    const ext    = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path   = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = await file.arrayBuffer();

    const result = await uploadToSupabase(bucket, path, buffer, file.type);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    urls.push(result.publicUrl);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
