import { normalizeText } from "@/lib/normalize";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: unknown };
    if (typeof body.text !== "string") {
      return NextResponse.json({ error: "text 必须是字符串" }, { status: 400 });
    }

    const text = body.text;
    const cleanedText = normalizeText(text);
    return NextResponse.json({ cleanedText });
  } catch {
    return NextResponse.json({ error: "无法解析请求体" }, { status: 400 });
  }
}
