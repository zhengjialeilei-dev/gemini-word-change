import { buildCleanedDocx } from "@/lib/docx";
import { isCleanedDocument } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    let body: { document?: unknown };
    try {
      body = (await req.json()) as { document?: unknown };
    } catch {
      return NextResponse.json({ error: "无法解析请求体" }, { status: 400 });
    }

    if (!isCleanedDocument(body.document)) {
      return NextResponse.json({ error: "缺少规整后的正文内容" }, { status: 400 });
    }

    const buffer = await buildCleanedDocx(body.document);
    const binary = new Uint8Array(buffer);
    return new Response(binary, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="cleaned-document.docx"',
      },
    });
  } catch {
    return NextResponse.json({ error: "导出失败，请稍后重试" }, { status: 500 });
  }
}
