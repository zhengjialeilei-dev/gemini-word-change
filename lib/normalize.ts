import { MAX_CLEANED_LINES, MAX_INPUT_CHARS } from "@/lib/types";

const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;
const MARKDOWN_PREFIX_REGEX = /^\s*(?:(?:#{1,6})|[-*+]|>\s?|\d+[.)])\s*/gm;
const SECTION_SPACING_REGEX = /\s*([，。！？；：、])\s*/g;
const BRACKET_SPACING_REGEX = /\s*([（）【】《》“”‘’])\s*/g;

function tightenChineseBrackets(value: string): string {
  return value
    .replace(/【\s+/g, "【")
    .replace(/\s+】/g, "】")
    .replace(/（\s+/g, "（")
    .replace(/\s+）/g, "）")
    .replace(/《\s+/g, "《")
    .replace(/\s+》/g, "》")
    .replace(/“\s+/g, "“")
    .replace(/\s+”/g, "”")
    .replace(/‘\s+/g, "‘")
    .replace(/\s+’/g, "’");
}

function stripMarkdownInline(value: string): string {
  return value
    .replace(/```([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/(^|\s)\*(?=\S)/g, "$1")
    .replace(/(?<=\S)\*(?=\s|$|[：:，。！？；,.!?])/g, "");
}

export function normalizeText(input: string): string {
  if (!input) return "";

  const cleanedLines = input
    .slice(0, MAX_INPUT_CHARS)
    .replace(/\r\n?/g, "\n")
    .replace(/\u3000/g, " ")
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(ZERO_WIDTH_REGEX, "")
    .replace(MARKDOWN_PREFIX_REGEX, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .split("\n")
    .map((line) =>
      stripMarkdownInline(line)
        .trim()
        .replace(BRACKET_SPACING_REGEX, "$1")
        .replace(SECTION_SPACING_REGEX, "$1")
        .replace(/\s+([,.;!?，。！？；：])/g, "$1")
        .replace(/([,.;!?，。！？；：]){2,}/g, "$1")
        .replace(/([，。！？；：、])([A-Za-z0-9])/g, "$1 $2")
        .replace(/([A-Za-z0-9])\s+([（【《])/g, "$1$2")
        .replace(/\s{2,}/g, " "),
    )
    .map((line) => tightenChineseBrackets(line))
    .filter(Boolean)
    .slice(0, MAX_CLEANED_LINES);

  return cleanedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\u3000/g, " ")
    .trim();
}
