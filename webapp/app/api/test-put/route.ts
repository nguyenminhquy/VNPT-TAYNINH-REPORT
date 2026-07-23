import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const wordBuffer = Buffer.from('hello world');
    const blob = await put(`exports/test_${Date.now()}.docx`, wordBuffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ blobUrl: blob.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
