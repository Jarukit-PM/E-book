import type { ParsedBook } from "../content/parseBook";

/** ย่อหน้าทั่วไปต่อหน้า — โหลดให้เต็มหน้ามากที่สุด (ยอมให้หน้าสุดท้ายก่อนขึ้นบทใหม่ว่างได้) */
export const DEFAULT_MAX_CHARS_PER_PAGE = 2600;

/** ย่อหน้าในหน้าแรกของบท (หัวบท + ภาพกินพื้นที่ — โควต้ายังเพิ่มได้เพราะต้องการให้เนื้อหาติดกันบนหน้าเดียว) */
const CHAPTER_FIRST_PAGE_BODY_CHARS = 1400;

/** ย่อหน้าหลังหัวคำนำ+คำคมในหน้าเดียวกัน — โควต้าสูง (ไม่มีภาบท) เพื่อให้หน้าแรกคำนำแน่นก่อนแบ่งหน้า; ยอมให้หน้าก่อนสารบัญว่างได้ถ้าเนื้อหาหมดบนหน้าแรก */
const PREFACE_OPENING_BODY_CHARS = 4800;

/** หน้าแรกบทส่งท้าย (หัว + ภาพ) — โควต้าสูงเพื่อรวมเนื้อบทส่งท้ายในหน้าเดียว ไม่แยกหน้าต่อ */
const EPILOGUE_FIRST_PAGE_BODY_CHARS = 5000;

/** รวมหน้าสุดท้ายที่เหลือเนื้อน้อยเกินไปเข้ากับหน้าก่อนหน้า ลดหน้าว่างปลายบท */
function mergeUnderfilledTailPages(
  pages: string[][],
  maxChars: number,
): string[][] {
  const out = pages.map((p) => [...p]);
  const orphanThreshold = Math.min(520, Math.floor(maxChars * 0.28));
  while (out.length >= 2) {
    const last = out[out.length - 1]!;
    const prev = out[out.length - 2]!;
    const lastLen = last.join("").length;
    const prevLen = prev.join("").length;
    if (
      lastLen <= orphanThreshold &&
      prevLen + lastLen <= Math.floor(maxChars * 1.55)
    ) {
      out[out.length - 2] = [...prev, ...last];
      out.pop();
    } else {
      break;
    }
  }
  return out;
}

export function paginateParagraphs(
  paragraphs: string[],
  maxChars: number = DEFAULT_MAX_CHARS_PER_PAGE,
): string[][] {
  const pages: string[][] = [];
  let bucket: string[] = [];
  let count = 0;

  const pushBucket = () => {
    if (bucket.length > 0) {
      pages.push(bucket);
      bucket = [];
      count = 0;
    }
  };

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;

    if (trimmed.length > maxChars * 1.4) {
      pushBucket();
      let rest = trimmed;
      while (rest.length > maxChars) {
        let cut = rest.lastIndexOf(" ", maxChars);
        if (cut < maxChars * 0.5) cut = maxChars;
        pages.push([rest.slice(0, cut).trim()]);
        rest = rest.slice(cut).trim();
      }
      if (rest.length) {
        bucket = [rest];
        count = rest.length;
      }
      continue;
    }

    if (count + trimmed.length > maxChars && bucket.length > 0) {
      pushBucket();
    }
    bucket.push(trimmed);
    count += trimmed.length;
  }
  pushBucket();
  const filled = pages.length > 0 ? pages : [[]];
  return mergeUnderfilledTailPages(filled, maxChars);
}

/** แยกย่อหน้าต้นๆ ให้จบในหน้าเดียวกับส่วนหัว (หัวข้อ/คำคม) */
export function takeLeadingParagraphs(
  paragraphs: string[],
  maxChars: number,
): { head: string[]; tail: string[] } {
  const head: string[] = [];
  const tail = [...paragraphs];
  let count = 0;
  while (tail.length > 0) {
    const next = tail[0];
    if (head.length > 0 && count + next.length > maxChars) break;
    if (head.length === 0 && next.length > maxChars * 1.2) break;
    head.push(next);
    tail.shift();
    count += next.length;
  }
  return { head, tail };
}

export type TocAnchor =
  | "preface"
  | "ch1"
  | "ch2"
  | "ch3"
  | "ch4"
  | "ch5"
  | "ch6"
  | "epilogue";

export type ChapterOpenerInfo = {
  chapterNum: number;
  titleLine: string;
  subtitle?: string;
};

export type PageSpec =
  | { kind: "cover-front" }
  | { kind: "preface-opening"; openingParagraphs: string[] }
  | { kind: "preface-body"; paragraphs: string[] }
  | { kind: "toc" }
  | {
      kind: "chapter-body";
      chapterNum: number;
      paragraphs: string[];
      dropCap: boolean;
      opener?: ChapterOpenerInfo;
    }
  | {
      kind: "epilogue-body";
      paragraphs: string[];
      dropCap: boolean;
      showTitle: boolean;
    }
  | { kind: "end" }
  | { kind: "cover-back" };

export function buildPageSpecs(book: ParsedBook): {
  specs: PageSpec[];
  anchorToIndex: Record<TocAnchor, number>;
} {
  const specs: PageSpec[] = [];
  const anchorToIndex = {} as Record<TocAnchor, number>;

  specs.push({ kind: "cover-front" });

  const { head: prefaceOpenParas, tail: prefaceRest } = takeLeadingParagraphs(
    book.preface.paragraphs,
    PREFACE_OPENING_BODY_CHARS,
  );
  specs.push({ kind: "preface-opening", openingParagraphs: prefaceOpenParas });
  anchorToIndex.preface = specs.length - 1;

  if (prefaceRest.length > 0) {
    for (const paras of paginateParagraphs(prefaceRest)) {
      if (paras.length === 0) continue;
      specs.push({ kind: "preface-body", paragraphs: paras });
    }
  }

  specs.push({ kind: "toc" });

  for (const ch of book.chapters) {
    const key = `ch${ch.num}` as TocAnchor;
    const opener: ChapterOpenerInfo = {
      chapterNum: ch.num,
      titleLine: ch.titleLine,
      subtitle: ch.subtitle,
    };

    let { head: firstParas, tail: chapterRest } = takeLeadingParagraphs(
      ch.paragraphs,
      CHAPTER_FIRST_PAGE_BODY_CHARS,
    );
    if (firstParas.length === 0 && ch.paragraphs.length > 0) {
      firstParas = [ch.paragraphs[0]];
      chapterRest = ch.paragraphs.slice(1);
    }

    if (firstParas.length > 0) {
      specs.push({
        kind: "chapter-body",
        chapterNum: ch.num,
        paragraphs: firstParas,
        dropCap: true,
        opener,
      });
      anchorToIndex[key] = specs.length - 1;
    }

    for (const paras of paginateParagraphs(chapterRest, DEFAULT_MAX_CHARS_PER_PAGE)) {
      if (paras.length === 0) continue;
      specs.push({
        kind: "chapter-body",
        chapterNum: ch.num,
        paragraphs: paras,
        dropCap: false,
      });
    }
  }

  let { head: epiFirst, tail: epiRest } = takeLeadingParagraphs(
    book.epilogue.paragraphs,
    EPILOGUE_FIRST_PAGE_BODY_CHARS,
  );
  if (epiFirst.length === 0 && book.epilogue.paragraphs.length > 0) {
    epiFirst = [book.epilogue.paragraphs[0]];
    epiRest = book.epilogue.paragraphs.slice(1);
  }
  if (epiFirst.length > 0) {
    specs.push({
      kind: "epilogue-body",
      paragraphs: epiFirst,
      dropCap: true,
      showTitle: true,
    });
    anchorToIndex.epilogue = specs.length - 1;
  }
  for (const paras of paginateParagraphs(epiRest, DEFAULT_MAX_CHARS_PER_PAGE)) {
    if (paras.length === 0) continue;
    specs.push({
      kind: "epilogue-body",
      paragraphs: paras,
      dropCap: false,
      showTitle: false,
    });
  }

  specs.push({ kind: "end" });
  specs.push({ kind: "cover-back" });

  return { specs, anchorToIndex };
}
