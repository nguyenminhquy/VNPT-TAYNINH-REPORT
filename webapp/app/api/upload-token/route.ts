import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  let body;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
  try {
    // Tự động quét toàn bộ biến môi trường để tìm cái nào có giá trị bắt đầu bằng vercel_blob_rw_
    // (Bất kể prefix là gì, VNPT_, NEW_, hay trống)
    let validToken = undefined;
    for (const key of Object.keys(process.env)) {
      const val = process.env[key];
      if (val && val.startsWith('vercel_blob_rw_')) {
        validToken = val;
        break;
      }
    }

    if (!validToken) {
      console.error("[upload-token] Không tìm thấy bất kỳ Vercel Blob Token nào trong biến môi trường.");
      return NextResponse.json({ error: 'Lỗi cấu hình máy chủ: Chưa kết nối Vercel Blob (Không tìm thấy token)' }, { status: 500 });
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token: validToken,
      onBeforeGenerateToken: async (pathname) => {
        return {
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          allowedContentTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream',
            'application/x-zip-compressed',
            '', // browser may not know the type
          ],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Upload hoàn tất
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("[upload-token] Error generating token:", error);
    // Nếu Vercel Blob ném lỗi, nó thường nằm ở error.message
    const msg = error?.message || 'Unknown error';
    return NextResponse.json({ error: `Lỗi Vercel Blob: ${msg}` }, { status: 400 });
  }
}
