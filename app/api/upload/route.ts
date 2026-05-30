import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const MAX_SIZE      = 5 * 1024 * 1024;
const ALLOWED       = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const VALID_BUCKETS = new Set(['listings', 'banners']);

// ── env-var diagnostic (no auth required) ────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    hasServiceKey:     !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasSupabaseUrl:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasJwtSecret:      !!process.env.JWT_SECRET,
    keyLength:          process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    supabaseUrlPrefix:  process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) ?? '(not set)',
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

// ── ensure bucket exists (creates it if missing) ──────────────────────────────
async function ensureBucket(supabaseUrl: string, serviceRoleKey: string, bucket: string): Promise<void> {
  try {
    const checkRes = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
      headers: { Authorization: `Bearer ${serviceRoleKey}` },
    });
    if (checkRes.ok) return;
    const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: bucket, name: bucket, public: true }),
    });
    console.log('[upload] ensureBucket create status:', createRes.status, bucket);
  } catch (err) {
    console.warn('[upload] ensureBucket non-fatal error:', err instanceof Error ? err.message : err);
  }
}

// ── upload helper (reads env lazily — safe for serverless cold starts) ────────
async function uploadToSupabase(
  bucket: string,
  path: string,
  buffer: ArrayBuffer,
  contentType: string,
): Promise<{ publicUrl: string } | { error: string; status: number }> {
  // Accept either NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[upload] env — url:', supabaseUrl?.slice(0, 40), 'keyLen:', serviceRoleKey?.length ?? 0);

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    console.error('[upload] NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) missing or placeholder');
    return { error: 'Storage not configured — add NEXT_PUBLIC_SUPABASE_URL to Vercel env vars', status: 500 };
  }
  if (!serviceRoleKey || serviceRoleKey === 'placeholder') {
    console.error('[upload] SUPABASE_SERVICE_ROLE_KEY missing or placeholder');
    return { error: 'Upload service key not configured — add SUPABASE_SERVICE_ROLE_KEY to env vars', status: 500 };
  }

  await ensureBucket(supabaseUrl, serviceRoleKey, bucket);

  const endpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
  console.log('[upload] → Storage:', endpoint.slice(0, 90));

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
    console.error('[upload] fetch threw (network error):', msg);
    return { error: `Network error reaching storage: ${msg}`, status: 502 };
  }

  console.log('[upload] Storage status:', res.status);

  if (!res.ok) {
    let errMsg = `Storage error ${res.status}`;
    try {
      const body = await res.json() as Record<string, unknown>;
      console.error('[upload] Storage error body:', JSON.stringify(body));
      if (typeof body.error   === 'string') errMsg = body.error;
      else if (typeof body.message === 'string') errMsg = body.message;
    } catch {
      const txt = await res.text().catch(() => '');
      console.error('[upload] Storage raw text:', txt.slice(0, 300));
      if (txt) errMsg = txt.slice(0, 200);
    }
    const status = res.status >= 400 && res.status < 600 ? res.status : 500;
    return { error: errMsg, status };
  }

  return { publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}` };
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    return await handlePost(req);
  } catch (err) {
    console.error('[upload] Unhandled exception:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error during upload' }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  console.log('[upload] POST');

  const userId = await verifyToken(req);
  if (!userId) {
    console.error('[upload] Auth failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch (err) {
    console.error('[upload] formData parse error:', err);
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const bucket = (fd.get('bucket') as string | null) ?? 'listings';
  if (!VALID_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  // ── Single-file mode: field "file" → { publicUrl } ────────────────────────
  const singleFile = fd.get('file') as File | null;
  if (singleFile) {
    console.log('[upload] single file — name:', singleFile.name, 'size:', singleFile.size, 'type:', singleFile.type);

    if (!ALLOWED.has(singleFile.type)) {
      return NextResponse.json({ error: 'Unsupported type — use JPG, PNG or WebP.' }, { status: 400 });
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
    console.log('[upload] done —', result.publicUrl.slice(0, 80));
    return NextResponse.json({ publicUrl: result.publicUrl });
  }

  // ── Multi-file mode: field "files" → { urls } ─────────────────────────────
  const files = fd.getAll('files') as File[];
  console.log('[upload] multi-file count:', files.length);
  if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  if (files.length > 5) return NextResponse.json({ error: 'Max 5 files' }, { status: 400 });

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: `${file.name}: unsupported type.` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${file.name}: exceeds 5 MB.` }, { status: 400 });
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
