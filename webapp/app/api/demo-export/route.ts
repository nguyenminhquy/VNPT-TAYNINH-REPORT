import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Call Python backend
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
    const res = await fetch(`${BACKEND_URL}/demo-export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="BAO_CAO_DEMO.docx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  } catch (error: any) {
    console.error("Lỗi xuất báo cáo demo:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo báo cáo demo" },
      { status: 500 }
    );
  }
}
