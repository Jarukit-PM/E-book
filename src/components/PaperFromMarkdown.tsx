import { forwardRef } from "react";
import { PageFrame } from "./PageFrame";
import ch1 from "../asset/1.png";
import ch2 from "../asset/2.png";
import ch3 from "../asset/3.png";
import ch4 from "../asset/4.png";
import ch5 from "../asset/5.png";
import ch6 from "../asset/6.png";
import epilogueArt from "../asset/last.png";

const CHAPTER_ART: Record<number, string> = {
  1: ch1,
  2: ch2,
  3: ch3,
  4: ch4,
  5: ch5,
  6: ch6,
};

type PaperMeta =
  | { kind: "preface-open"; title: string; quote: string }
  | { kind: "body"; dropCap: boolean }
  | {
      kind: "chapter-start";
      chapterNum: number;
      titleLine: string;
      subtitle?: string;
      dropCap: boolean;
    }
  | {
      kind: "epilogue";
      showTitle: boolean;
      dropCap: boolean;
      titleLine: string;
    };

function parsePaperFile(content: string): { meta: PaperMeta; paragraphs: string[] } {
  const trimmed = content.trim();
  const m = trimmed.match(/^---json\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
  if (!m) {
    const paras = splitParagraphs(trimmed);
    return { meta: { kind: "body", dropCap: false }, paragraphs: paras };
  }
  const meta = JSON.parse(m[1]) as PaperMeta;
  const paragraphs = splitParagraphs(m[2].trim());
  return { meta, paragraphs };
}

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type Props = { source: string };

export const PaperFromMarkdown = forwardRef<HTMLDivElement, Props>(
  function PaperFromMarkdown({ source }, ref) {
    const { meta, paragraphs } = parsePaperFile(source);

    if (meta.kind === "preface-open") {
      return (
        <PageFrame ref={ref} variant="paper">
          <div className="book-body flex h-full flex-col px-7 pb-12 pt-9 md:px-9 md:pt-10">
            <h2 className="font-display text-lg font-semibold leading-snug text-ink md:text-xl">
              {meta.title}
            </h2>
            <blockquote className="mt-4 border-l-4 border-cover-accent/70 pl-3 font-serif text-sm italic leading-relaxed text-ink-soft md:mt-5 md:pl-4 md:text-[0.95rem]">
              {meta.quote}
            </blockquote>
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={`mt-4 text-justify font-serif text-sm leading-relaxed text-ink md:mt-5 md:text-[0.95rem] ${i === 0 ? "dropcap" : ""}`}
              >
                {p}
              </p>
            ))}
          </div>
        </PageFrame>
      );
    }

    if (meta.kind === "chapter-start") {
      const titleDisplay = meta.titleLine.replace(/^บทที่ \d+:\s*/, "");
      return (
        <PageFrame ref={ref} variant="paper">
          <div className="book-body flex h-full flex-col px-7 pb-14 pt-6 md:px-9 md:pt-8">
            <header className="mb-4 shrink-0 border-b border-paper-300/60 pb-3 md:mb-5">
              <div className="flex items-start gap-3">
                <span className="font-display text-3xl font-bold leading-none text-cover-accent/90 md:text-4xl">
                  {meta.chapterNum}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-semibold leading-snug text-ink md:text-lg">
                    {titleDisplay}
                  </h2>
                  {meta.subtitle ? (
                    <p className="mt-1.5 font-serif text-xs italic text-ink-muted md:text-sm">
                      {meta.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
            </header>
            {CHAPTER_ART[meta.chapterNum] ? (
              <div className="mb-3 shrink-0">
                <img
                  src={CHAPTER_ART[meta.chapterNum]}
                  alt=""
                  className="mx-auto max-h-[min(200px,32vh)] w-full rounded-sm object-contain ring-1 ring-ink/10 md:max-h-[min(240px,36vh)]"
                />
              </div>
            ) : null}
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={`mb-3 text-justify font-serif text-sm leading-relaxed text-ink md:text-[0.95rem] ${meta.dropCap && i === 0 ? "dropcap" : ""}`}
              >
                {p}
              </p>
            ))}
          </div>
        </PageFrame>
      );
    }

    if (meta.kind === "epilogue") {
      return (
        <PageFrame ref={ref} variant="paper">
          <div className="book-body flex h-full flex-col px-7 pb-14 pt-8 md:px-9 md:pt-10">
            {meta.showTitle ? (
              <h2 className="mb-4 font-display text-base font-semibold leading-snug text-ink md:text-lg">
                {meta.titleLine}
              </h2>
            ) : null}
            <div className="mb-4 shrink-0">
              <img
                src={epilogueArt}
                alt=""
                className="mx-auto max-h-[min(220px,34vh)] w-full rounded-sm object-contain ring-1 ring-ink/10 md:max-h-[min(260px,38vh)]"
              />
            </div>
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={`mb-3 text-justify font-serif text-sm leading-relaxed text-ink md:text-[0.95rem] ${meta.dropCap && i === 0 ? "dropcap" : ""}`}
              >
                {p}
              </p>
            ))}
          </div>
        </PageFrame>
      );
    }

    return (
      <PageFrame ref={ref} variant="paper">
        <div className="book-body flex h-full flex-col px-7 pb-14 pt-8 md:px-9 md:pt-10">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={`mb-3 text-justify font-serif text-sm leading-relaxed text-ink md:text-[0.95rem] ${meta.dropCap && i === 0 ? "dropcap" : ""}`}
            >
              {p}
            </p>
          ))}
        </div>
      </PageFrame>
    );
  },
);
