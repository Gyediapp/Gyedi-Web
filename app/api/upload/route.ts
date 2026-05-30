import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED  = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

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

// ── diagnostic GET (no auth required) ────────────────────────────────────────
export async function GET() {
  const cldName   = process.env.CLOUDINARY_CLOUD_NAME;
  const cldKey    = process.env.CLOUDINARY_API_KEY;
  const cldSecret = process.env.CLOUDINARY_API_SECRET;
  return NextResponse.json({
    provider:       cldName && cldKey && cldSecret ? 'cloudinary' : 'supabase',
    cloudinary:     { hasCloudName: !!cldName, hasApiKey: !!cldKey, hasApiSecret: !!cldSecret },
    supabase:       {
      hasSupabaseUrl:  !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      hasServiceKey:   !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLen:   process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    },
    hasJwtSecret:   !!process.env.JWT_SECRET,
  });
}

// ── Cloudinary signed upload ──────────────────────────────────────────────────
async function uploadToCloudinary(
  buffer: ArrayBuffer,
  contentType: string,
  userId: string,
): Promise<{ publicUrl: string } | { error: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey    = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const folder    = `gyedi/listings/${userId}`;
  const timestamp = Math.round(Date.now() / 1000);

  // Sign: alphabetical params (excluding file and api_key) + secret
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: contentType }));
  form.append('api_key',   apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder',    folder);

  console.log('[upload] → Cloudinary cloud:', cloudName, 'folder:', folder);

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: form },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[upload] Cloudinary network error:', msg);
    return { error: `Network error reaching Cloudinary: ${msg}` };
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json() as Record<string, unknown>;
  } catch {
    const txt = await res.text().catch(() => '(empty)');
    console.error('[upload] Cloudinary non-JSON:', res.status, txt.slice(0, 200));
    return { error: `Cloudinary error ${res.status}` };
  }

  if (!res.ok || data.error) {
    const msg = (data.error as Record<string, string>)?.message ?? `Cloudinary error ${res.status}`;
    console.error('[upload] Cloudinary error:', msg, JSON.stringify(data).slice(0, 300));
    return { error: msg };
  }

  const publicUrl = (data.secure_url ?? data.url) as string;
  console.log('[upload] Cloudinary done:', publicUrl?.slice(0, 80));
  return { publicUrl };
}

// ── Supabase Storage upload (fallback) ────────────────────────────────────────
async function uploadToSupabase(
  bucket: string,
  path: string,
  buffer: ArrayBuffer,
  contentType: string,
): Promise<{ publicUrl: string } | { error: string; status: number }> {
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[upload] supabase url:', supabaseUrl?.slice(0, 40), 'keyLen:', serviceRoleKey?.length ?? 0);

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: 'Storage not configured — add NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to Vercel env vars', status: 500 };
  }

  // Ensure bucket exists (idempotent)
  try {
    const check = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
      headers: { Authorization: `Bearer ${serviceRoleKey}` },
    });
    if (!check.ok) {
      const create = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: bucket, name: bucket, public: true }),
      });
      console.log('[upload] bucket create status:', create.status, bucket);
    }
  } catch (e) {
    console.warn('[upload] bucket ensure failed (non-fatal):', e);
  }

  const endpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
  console.log('[upload] → Supabase Storage:', endpoint.slice(0, 90));

  let res: Response;
  try {
    // Use Uint8Array — ArrayBuffer body is not reliably sent by all Node.js fetch implementations
    res = await fetch(endpoint, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${serviceRoleKey}`,
        'Content-Type': contentType,
        'x-upsert':     'true',
      },
      body: new Uint8Array(buffer),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[upload] Supabase fetch error:', msg);
    return { error: `Network error: ${msg}`, status: 502 };
  }

  console.log('[upload] Supabase response:', res.status, res.statusText);

  if (!res.ok) {
    let errMsg = `Storage error ${res.status}`;
    try {
      const body = await res.json() as Record<string, unknown>;
      console.error('[upload] Supabase error body:', JSON.stringify(body));
      errMsg = (body.error ?? body.message ?? errMsg) as string;
    } catch {
      const txt = await res.text().catch(() => '');
      console.error('[upload] Supabase raw text:', txt.slice(0, 200));
      if (txt) errMsg = txt.slice(0, 200);
    }
    return { error: errMsg, status: res.status >= 400 ? res.status : 500 };
  }

  const ok = await res.json().catch(() => null);
  console.log('[upload] Supabase done:', JSON.stringify(ok)?.slice(0, 100));
  return { publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}` };
}

// ── single-file upload helper ─────────────────────────────────────────────────
async function uploadOne(
  buffer: ArrayBuffer,
  contentType: string,
  fileName: string,
  userId: string,
  bucket: string,
): Promise<{ publicUrl: string } | { error: string }> {
  const useCld = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  console.log('[upload] provider:', useCld ? 'cloudinary' : 'supabase');

  if (useCld) {
    return uploadToCloudinary(buffer, contentType, userId);
  }

  const ext  = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const res  = await uploadToSupabase(bucket, path, buffer, contentType);
  if ('status' in res && 'error' in res) return { error: res.error };
  return res;
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    return await handlePost(req);
  } catch (err) {
    console.error('[upload] UNHANDLED EXCEPTION:', err instanceof Error ? err.stack : String(err));
    return NextResponse.json({ error: 'Internal server error during upload' }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  const ts = new Date().toISOString();
  console.log('[upload] POST', ts);

  const userId = await verifyToken(req);
  if (!userId) {
    console.error('[upload] auth failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[upload] userId:', userId);

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch (err) {
    console.error('[upload] formData error:', err);
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const bucket = (fd.get('bucket') as string | null) ?? 'listings';
  if (!new Set(['listings', 'banners']).has(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  // ── Single file ──────────────────────────────────────────────────────────
  const file = fd.get('file') as File | null;
  if (file) {
    console.log('[upload] single file — name:', file.name, 'size:', file.size, 'type:', file.type);

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported type — use JPG, PNG or WebP.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 5 MB limit.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    console.log('[upload] buffer byteLength:', buffer.byteLength);

    const result = await uploadOne(buffer, file.type, file.name, userId, bucket);
    if ('error' in result) {
      console.error('[upload] upload failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    console.log('[upload] success — publicUrl:', result.publicUrl.slice(0, 80));
    return NextResponse.json({ publicUrl: result.publicUrl });
  }

  // ── Multi-file ───────────────────────────────────────────────────────────
  const files = fd.getAll('files') as File[];
  console.log('[upload] multi-file count:', files.length);
  if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  if (files.length > 5) return NextResponse.json({ error: 'Max 5 files' }, { status: 400 });

  const urls: string[] = [];
  for (const f of files) {
    if (!ALLOWED.has(f.type)) return NextResponse.json({ error: `${f.name}: unsupported type.` }, { status: 400 });
    if (f.size > MAX_SIZE)    return NextResponse.json({ error: `${f.name}: exceeds 5 MB.` },       { status: 400 });

    const buf    = await f.arrayBuffer();
    const result = await uploadOne(buf, f.type, f.name, userId, bucket);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 });
    urls.push(result.publicUrl);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
