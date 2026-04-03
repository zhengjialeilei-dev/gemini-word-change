export type BriefReport = {
  topic: string;
  keyPoints: string[];
  conclusion: string;
  suggestions: string[];
  cleanedText: string;
};

export type CleanedDocument = {
  title?: string;
  cleanedText: string;
};

export const MAX_INPUT_CHARS = 20000;
export const MAX_REPORT_ITEMS = 6;
export const MAX_CLEANED_LINES = 200;

export function isBriefReport(value: unknown): value is BriefReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<BriefReport>;

  return (
    typeof report.topic === "string" &&
    Array.isArray(report.keyPoints) &&
    report.keyPoints.every((item) => typeof item === "string") &&
    typeof report.conclusion === "string" &&
    Array.isArray(report.suggestions) &&
    report.suggestions.every((item) => typeof item === "string") &&
    typeof report.cleanedText === "string"
  );
}

export function isCleanedDocument(value: unknown): value is CleanedDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as Partial<CleanedDocument>;

  return (
    (typeof doc.title === "string" || typeof doc.title === "undefined") &&
    typeof doc.cleanedText === "string"
  );
}
