import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
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
