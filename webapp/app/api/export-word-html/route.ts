import { NextResponse } from 'next/server';
// @ts-ignore
import HTMLtoDOCX from 'html-to-docx';

export async function POST(request: Request) {
  try {
    const { html, title } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
    }

    // Add some basic styling wrapper if it's just plain HTML fragments
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>${title || 'Document'}</title>
          <style>
              body {
                  font-family: 'Times New Roman', serif;
                  font-size: 14pt;
                  line-height: 1.5;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
              }
              td, th {
                  padding: 5px;
              }
              p {
                  margin: 0 0 10pt 0;
              }
              h1, h2, h3, h4, h5, h6 {
                  margin: 10pt 0;
              }
          </style>
      </head>
      <body>
          ${html}
      </body>
      </html>
    `;

    // html-to-docx options
    const options = {
      orientation: 'portrait',
      margins: {
        top: 1440, // 1 inch in TWIPs
        right: 1440,
        bottom: 1440,
        left: 1440,
      },
      title: title || 'Document',
      font: 'Times New Roman',
      fontSize: 28, // 14pt (measured in half-points)
    };

    // Generate the docx blob (Buffer in Node.js)
    const fileBuffer = await HTMLtoDOCX(fullHtml, null, options);

    // Return the file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title || 'Van_ban_hanh_chinh')}.docx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating word doc from HTML:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
