import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function buildFilename() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `Bao_Cao_Giao_Ban_${d}_${m}_${y}_${h}h${min}.docx`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exporterName = session.user.name || 'Người dùng ẩn danh';
    const exportedBy = session.user.email || 'unknown';

    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const wordBuffer = Buffer.from(arrayBuffer);
    const fileSize = wordBuffer.byteLength;
    const filename = buildFilename();

    let blobUrl: string;
    try {
      const blob = await put(
        `exports/${filename}`,
        wordBuffer,
        {
          access: 'public',
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
      );
      blobUrl = blob.url;
    } catch (uploadError) {
      console.error('[export-word-save] Vercel Blob upload error:', uploadError);
      return NextResponse.json(
        { error: 'Lỗi khi upload file lên storage. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    const weekLabel = `Báo cáo ${new Date().toLocaleDateString('vi-VN')}`;
    const { error: insertError } = await supabaseAdmin
      .from('export_history')
      .insert({
        blob_url:      blobUrl,
        blob_pathname: `exports/${filename}`,
        filename,
        file_size:     fileSize,
        exporter_name: exporterName,
        exported_by:   exportedBy,
        week_label:    weekLabel,
      });

    if (insertError) {
      console.error('[export-word-save] insert export_history error:', insertError);
    }

    return NextResponse.json({ blobUrl, filename, fileSize }, { status: 200 });
  } catch (error) {
    console.error('[export-word-save] unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ. Vui lòng liên hệ quản trị viên.' },
      { status: 500 }
    );
  }
}
