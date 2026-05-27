import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase-admin';

const MAX_SIZE      = 5 * 1024 * 1024;
const ALLOWED       = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const VALID_BUCKETS = new Set(['listings', 'banners']);

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

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const bucket = (fd.get('bucket') as string | null) ?? 'listings';
  if (!VALID_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  // Single-file mode: field "file" → returns { publicUrl }
  const singleFile = fd.get('file') as File | null;
  if (singleFile) {
    if (!ALLOWED.has(singleFile.type)) {
      return NextResponse.json({ error: 'Unsupported type. Use JPG, PNG or WebP.' }, { status: 400 });
    }
    if (singleFile.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 5 MB limit.' }, { status: 400 });
    }

    const ext    = singleFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path   = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await singleFile.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, { contentType: singleFile.type, upsert: true });

    if (error) {
      console.error('[upload] Supabase error:', error.message);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ publicUrl: data.publicUrl });
  }

  // Multi-file mode: field "files" → returns { urls }
  const files = fd.getAll('files') as File[];
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
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error('[upload] Supabase error:', error.message);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
