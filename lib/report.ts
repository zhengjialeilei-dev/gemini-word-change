import { normalizeText } from "@/lib/normalize";
import {
  BriefReport,
  MAX_INPUT_CHARS,
  MAX_REPORT_ITEMS,
} from "@/lib/types";

type ReportPayload = Omit<BriefReport, "cleanedText">;

function clampText(value: string, max = 120): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function sanitizeSentence(value: string, max = 120): string {
  return clampText(value.replace(/^[\-*•·\d.、()\s]+/, ""), max);
}

function splitSentences(input: string): string[] {
  return input
    .split(/(?<=[。！？!?\.])\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizeSentence(item))
    .filter(Boolean);
}

function fallbackReport(cleanedText: string): ReportPayload {
  const sentences = splitSentences(cleanedText);
  const topicSource = sentences[0] ?? cleanedText.slice(0, 40) ?? "未命名主题";
  const topic = clampText(topicSource, 40) || "未命名主题";

  const keyPoints = sentences
    .slice(0, MAX_REPORT_ITEMS)
    .map((item) => sanitizeSentence(item));
  if (keyPoints.length === 0) {
    keyPoints.push("原始内容较短，建议补充更多背景信息后再生成报告。");
  }

  const conclusion =
    sentences.length > 0
      ? `文本核心聚焦于“${topic}”，内容已被规整为可复用文案格式。`
      : "文本已完成规整，但内容较少，建议补充更多信息以获得更完整结论。";

  const suggestions = [
    "将该文案按受众再拆分为对内版和对外版。",
    "补充 1-2 条可执行动作，便于后续推进。",
    "如用于发布，建议增加一个明确标题与结尾 CTA。",
  ];

  return { topic, keyPoints, conclusion, suggestions };
}

async function aiReport(cleanedText: string, apiKey: string): Promise<ReportPayload> {
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "你是中文文案分析助手。请严格输出 JSON，字段为 topic(string), keyPoints(string[]), conclusion(string), suggestions(string[])。",
      },
      {
        role: "user",
        content: `请基于下面内容生成简要报告，要求简洁、可执行。\n\n${cleanedText}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI 返回为空");

  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI JSON 结构不完整");
  }

  const candidate = parsed as Partial<ReportPayload>;
  const topic = clampText(candidate.topic ?? "", 50);
  const keyPoints = safeStringArray(candidate.keyPoints).slice(0, MAX_REPORT_ITEMS);
  const conclusion = clampText(candidate.conclusion ?? "", 180);
  const suggestions = safeStringArray(candidate.suggestions).slice(0, MAX_REPORT_ITEMS);

  if (!topic || keyPoints.length === 0 || !conclusion || suggestions.length === 0) {
    throw new Error("AI JSON 结构不完整");
  }

  return {
    topic,
    keyPoints,
    conclusion,
    suggestions,
  };
}

export async function generateReport(inputText: string): Promise<BriefReport> {
  const cleanedText = normalizeText(inputText).slice(0, MAX_INPUT_CHARS);
  if (!cleanedText) {
    return {
      topic: "空文本",
      keyPoints: ["未检测到有效文本，请输入内容后再试。"],
      conclusion: "当前无法生成有效结论。",
      suggestions: ["请先粘贴需要处理的文案内容。"],
      cleanedText: "",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const payload = apiKey
    ? await aiReport(cleanedText, apiKey).catch(() => fallbackReport(cleanedText))
    : fallbackReport(cleanedText);

  return {
    topic: clampText(payload.topic, 60),
    keyPoints: payload.keyPoints.map((item) => sanitizeSentence(item, 120)),
    conclusion: sanitizeSentence(payload.conclusion, 200),
    suggestions: payload.suggestions.map((item) => sanitizeSentence(item, 120)),
    cleanedText,
  };
}
