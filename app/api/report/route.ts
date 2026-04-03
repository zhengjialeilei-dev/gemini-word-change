import { generateReport } from "@/lib/report";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    let body: { text?: unknown };
    try {
      body = (await req.json()) as { text?: unknown };
    } catch {
      return NextResponse.json({ error: "无法解析请求体" }, { status: 400 });
    }

    if (typeof body.text !== "string") {
      return NextResponse.json({ error: "text 必须是字符串" }, { status: 400 });
    }

    const report = await generateReport(body.text);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "报告生成失败，请稍后重试" }, { status: 500 });
  }
}
