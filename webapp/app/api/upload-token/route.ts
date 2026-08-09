import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  
  try {
    // Tìm token trong env (hỗ trợ cả khi có prefix như NEW_BLOB_READ_WRITE_TOKEN)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || 
                     Object.keys(process.env).find(k => k.endsWith('_BLOB_READ_WRITE_TOKEN')) 
                     ? process.env[Object.keys(process.env).find(k => k.endsWith('_BLOB_READ_WRITE_TOKEN'))!] 
                     : undefined;

    const jsonResponse = await handleUpload({
      body,
      request,
      token: blobToken,
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
        // Upload hoàn tất, DB update sẽ được gọi từ client sau
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[upload-token] Error generating token:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
