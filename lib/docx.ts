import { CleanedDocument, MAX_CLEANED_LINES } from "@/lib/types";
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export async function buildCleanedDocx(docContent: CleanedDocument): Promise<Buffer> {
  const cleanedLines = docContent.cleanedText.split("\n");
  const visibleLines = cleanedLines.slice(0, MAX_CLEANED_LINES);
  const formalTitle = docContent.title?.trim() || "规整文案";

  const bodyParagraphs = visibleLines.map(
    (line) =>
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 420 },
        spacing: { line: 420, after: 140 },
        children: [
          new TextRun({
            text: line,
            font: "KaiTi",
            size: 24,
          }),
        ],
      }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "KaiTi",
            size: 24,
          },
        },
      },
    },
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: formalTitle,
                font: "SimHei",
                size: 32,
                bold: true,
              }),
            ],
          }),
          ...bodyParagraphs,
          ...(cleanedLines.length > MAX_CLEANED_LINES
            ? [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { before: 120 },
                  children: [
                    new TextRun({
                      text: "注：内容较长，导出时仅保留前 200 行。",
                      font: "KaiTi",
                      size: 22,
                      italics: true,
                    }),
                  ],
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
