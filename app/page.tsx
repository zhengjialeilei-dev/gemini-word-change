"use client";

import { useState } from "react";

type BusyState = "idle" | "cleaning" | "reporting" | "exporting";

type ReportData = {
  topic: string;
  keyPoints: string[];
  conclusion: string;
  suggestions: string[];
  cleanedText: string;
};

const SAMPLE_TEXT = `## AI 项目汇报草稿

今天我们重点推进了文案整理工具的 MVP，整体目标是让用户把 AI 生成的原始文本快速整理成可直接发送和归档的版本。

- 当前已完成基础文本清洗能力，可以去掉多余空格、符号和杂乱格式。
- 下一步希望增强移动端体验，并支持 Word 导出，方便团队直接交付。

总体来看，这个方向适合做成一个轻量级网页工具，优先满足日常效率场景。`;

function getExportTitle(inputText: string, cleanedText: string): string {
  const source = cleanedText || inputText;
  const firstLine = source
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? firstLine.slice(0, 30) : "规整文案";
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [busy, setBusy] = useState<BusyState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const hasInput = inputText.trim().length > 0;
  const hasCleanedText = cleanedText.trim().length > 0;

  function resetFeedback() {
    setError("");
    setNotice("");
  }

  function fillSample() {
    setInputText(SAMPLE_TEXT);
    setCleanedText("");
    setReport(null);
    setError("");
    setNotice("已填入示例文本。");
  }

  async function handleClean() {
    resetFeedback();
    setBusy("cleaning");

    try {
      const response = await fetch("/api/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = (await response.json()) as {
        cleanedText?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "规整失败");

      setCleanedText(data.cleanedText ?? "");
      setReport(null);
      setNotice("规整完成。");
    } catch (cleanError) {
      setError(cleanError instanceof Error ? cleanError.message : "规整失败");
    } finally {
      setBusy("idle");
    }
  }

  async function handleGenerateReport() {
    resetFeedback();
    setBusy("reporting");

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText || inputText }),
      });

      const data = (await response.json()) as {
        report?: ReportData;
        error?: string;
      };
      if (!response.ok || !data.report) {
        throw new Error(data.error ?? "报告生成失败");
      }

      setReport(data.report);
      if (data.report.cleanedText) {
        setCleanedText(data.report.cleanedText);
      }
      setNotice("报告生成完成。");
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : "报告生成失败");
    } finally {
      setBusy("idle");
    }
  }

  async function handleExportWord() {
    if (!hasCleanedText) return;

    resetFeedback();
    setBusy("exporting");

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: {
            title: getExportTitle(inputText, cleanedText),
            cleanedText,
          },
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "导出失败");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cleaned-document.docx";
      link.click();
      URL.revokeObjectURL(url);
      setNotice("Word 文档已开始下载。");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "导出失败");
    } finally {
      setBusy("idle");
    }
  }

  async function handleCopyCleaned() {
    if (!hasCleanedText) return;

    resetFeedback();

    try {
      await navigator.clipboard.writeText(cleanedText);
      setNotice("文案已复制。");
    } catch {
      setError("复制失败，请手动复制。");
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        {(notice || error) && (
          <section
            className={`rounded-[20px] border px-5 py-4 text-base leading-7 ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || notice}
          </section>
        )}

        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_48px_rgba(41,37,36,0.08)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
                Gemini Word Change
              </p>
              <h1 className="mt-4 font-serif text-[1.9rem] font-semibold text-stone-950 sm:text-[2.6rem]">
                把 AI 原始文本规整成可交付文案
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-stone-500">
                支持文本规整、简要报告生成和 Word 导出，适合处理 Gemini 或其他 AI 输出的草稿、汇报、会议纪要与长段落内容。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-stone-500 sm:grid-cols-4">
              <div className="rounded-2xl border border-stone-200 bg-white/60 p-3">
                <div className="text-lg font-semibold text-stone-950">Clean</div>
                <div className="mt-1">规整文本</div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/60 p-3">
                <div className="text-lg font-semibold text-stone-950">Report</div>
                <div className="mt-1">简要总结</div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/60 p-3">
                <div className="text-lg font-semibold text-stone-950">Word</div>
                <div className="mt-1">导出文档</div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/60 p-3">
                <div className="text-lg font-semibold text-stone-950">Mobile</div>
                <div className="mt-1">移动端适配</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-[1.6rem] font-semibold text-stone-950 sm:text-[2rem]">
                  原始文本
                </h2>
                <p className="mt-2 text-base leading-7 text-stone-500">
                  粘贴需要处理的 AI 草稿或原始文案。
                </p>
              </div>
              <button
                className="text-sm text-stone-400 underline-offset-4 transition hover:text-stone-700 hover:underline"
                onClick={fillSample}
                type="button"
              >
                插入示例文本
              </button>
            </div>

            <textarea
              className="min-h-[420px] w-full rounded-[18px] border border-stone-300/80 bg-[var(--surface-strong)] p-5 text-[17px] leading-8 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="把原始文本贴在这里..."
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-base font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={busy !== "idle" || !hasInput}
                onClick={handleClean}
                type="button"
              >
                {busy === "cleaning" ? "规整中..." : "规整文本"}
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-base font-medium text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={busy !== "idle" || !hasInput}
                onClick={handleGenerateReport}
                type="button"
              >
                {busy === "reporting" ? "生成中..." : "生成报告"}
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-base font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={busy !== "idle" || !hasCleanedText}
                onClick={handleExportWord}
                type="button"
              >
                {busy === "exporting" ? "导出中..." : "导出 Word"}
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <section className="rounded-[24px] border border-stone-900/10 bg-stone-950 p-5 text-white shadow-[0_18px_48px_rgba(28,25,23,0.18)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[1.3rem] font-semibold">规整后文案</h2>
                  <p className="text-base leading-7 text-stone-400">
                    保留正文内容，也尽量保留公式、emoji 和图案符号。
                  </p>
                </div>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-base text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!hasCleanedText}
                  onClick={handleCopyCleaned}
                  type="button"
                >
                  复制
                </button>
              </div>

              <textarea
                className="min-h-[280px] w-full rounded-[18px] border border-white/10 bg-white/5 p-5 text-[17px] leading-8 text-white outline-none placeholder:text-stone-500"
                value={cleanedText}
                readOnly
                placeholder="规整结果会显示在这里"
              />
            </section>

            <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
              <div>
                <h2 className="font-serif text-[1.5rem] font-semibold text-stone-950">
                  简要报告
                </h2>
                <p className="mt-2 text-base leading-7 text-stone-500">
                  自动提炼主题、重点、结论和建议。
                </p>
              </div>

              {!report ? (
                <div className="mt-4 rounded-[18px] border border-dashed border-stone-300 bg-stone-50/70 px-4 py-5 text-base leading-7 text-stone-500">
                  生成报告后，这里会显示主题、核心要点、结论和建议。
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <section className="rounded-[18px] border border-stone-200 bg-stone-50/70 p-4">
                    <div className="text-sm uppercase tracking-[0.16em] text-stone-400">
                      Topic
                    </div>
                    <div className="mt-2 text-lg font-semibold text-stone-950">
                      {report.topic}
                    </div>
                  </section>

                  <section className="rounded-[18px] border border-stone-200 bg-stone-50/70 p-4">
                    <div className="text-sm uppercase tracking-[0.16em] text-stone-400">
                      Key Points
                    </div>
                    <ul className="mt-3 space-y-2 text-base leading-7 text-stone-700">
                      {report.keyPoints.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="rounded-[18px] border border-stone-200 bg-stone-50/70 p-4">
                    <div className="text-sm uppercase tracking-[0.16em] text-stone-400">
                      Conclusion
                    </div>
                    <p className="mt-2 text-base leading-7 text-stone-700">
                      {report.conclusion}
                    </p>
                  </section>

                  <section className="rounded-[18px] border border-stone-200 bg-stone-50/70 p-4">
                    <div className="text-sm uppercase tracking-[0.16em] text-stone-400">
                      Suggestions
                    </div>
                    <ul className="mt-3 space-y-2 text-base leading-7 text-stone-700">
                      {report.suggestions.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
