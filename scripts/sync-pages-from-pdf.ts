/**
 * ดึงข้อความจาก PDF ที่จัดหน้าแล้ว (หนึ่งหน้า PDF ≈ หนึ่งหน้าใน flip book)
 * เขียนทับ src/content/pages/*.md และ page-manifest.json
 *
 * รัน: npm run sync:pdf
 * (ค่าเริ่มต้น = ไฟล์ใน Downloads ชื่อเดียวกับที่ผู้ใช้แนบ)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";
import { parseBookFromRaw } from "../src/content/parseBook";
import type { PageManifest, ManifestSequenceItem } from "../src/content/manifest.types";
import type { TocAnchor } from "../src/lib/paginate";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const DEFAULT_PDF = path.join(
  process.env.HOME ?? "",
  "Downloads",
  "E-Book_ อย่าอ่าน! ถ้าคุณยังสนุกกับการเป็นหนี้เพื่อรักษาหน้าตาทางสังคม.pdf",
);

function nfkc(s: string): string {
  return s.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function splitBodyToParagraphs(text: string, maxLen = 720): string[] {
  const t = nfkc(text);
  if (!t) return [];
  const out: string[] = [];
  let start = 0;
  while (start < t.length) {
    let end = Math.min(start + maxLen, t.length);
    if (end < t.length) {
      const slice = t.slice(start, end);
      const lastSpace = slice.lastIndexOf(" ");
      if (lastSpace > maxLen * 0.42) end = start + lastSpace;
    }
    const chunk = t.slice(start, end).trim();
    if (chunk) out.push(chunk);
    start = end;
    while (start < t.length && t[start] === " ") start++;
  }
  return out;
}

function parsePrefacePage(full: string): {
  title: string;
  quote: string;
  body: string;
} {
  const t = nfkc(full);
  const q1 = t.indexOf('"');
  if (q1 === -1) {
    return {
      title: "คำนำผู้เขียน",
      quote: "",
      body: t,
    };
  }
  const title = t.slice(0, q1).trim();
  const after = t.slice(q1 + 1);
  const q2 = after.indexOf('"');
  const quote = q2 === -1 ? after.trim() : after.slice(0, q2).trim();
  const body = q2 === -1 ? "" : after.slice(q2 + 1).trim();
  return { title, quote, body };
}

function tryChapterStart(
  full: string,
):
  | {
      chapterNum: number;
      titleLine: string;
      subtitle?: string;
      body: string;
    }
  | null {
  const t = nfkc(full);
  const m = t.match(
    /^บทที่ (\d+):\s*(.+?)\s*\(([^)]+)\)\s*(.*)$/s,
  );
  if (!m) return null;
  const num = Number(m[1]);
  const titleLine = `บทที่ ${num}: ${m[2].trim()}`;
  const subtitle = `(${m[3].trim()})`;
  const body = m[4].trim();
  return { chapterNum: num, titleLine, subtitle, body };
}

function tryEpilogue(full: string): { titleLine: string; body: string } | null {
  const t = nfkc(full);
  if (!t.startsWith("บทส่งท้าย")) return null;
  const m = t.match(/^(บทส่งท้าย:.+?\))\s+(อ่านมาถึง[\s\S]*)$/);
  if (m) {
    return { titleLine: m[1].trim(), body: m[2].trim() };
  }
  const cut = t.indexOf(" ", 40);
  if (cut === -1) return { titleLine: "บทส่งท้าย", body: t };
  return { titleLine: t.slice(0, cut).trim(), body: t.slice(cut).trim() };
}

function wrapJson(obj: object): string {
  return `---json\n${JSON.stringify(obj)}\n---\n\n`;
}

async function main() {
  const pdfPath = process.argv[2] ?? DEFAULT_PDF;
  if (!fs.existsSync(pdfPath)) {
    console.error("ไม่พบ PDF:", pdfPath);
    process.exit(1);
  }

  const rawPath = path.join(root, "raw.md");
  const book = parseBookFromRaw(fs.readFileSync(rawPath, "utf8"));

  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  await parser.destroy();

  const pagesDir = path.join(root, "src/content/pages");
  try {
    fs.rmSync(pagesDir, { recursive: true });
  } catch {
    /* */
  }
  fs.mkdirSync(pagesDir, { recursive: true });

  const pdfPages = result.pages.map((p) => nfkc(p.text || ""));
  if (pdfPages.length < 3) {
    console.error("PDF หน้าน้อยเกินไป");
    process.exit(1);
  }

  const sequence: ManifestSequenceItem[] = [{ type: "cover-front" }];

  const tocAnchors = {} as Record<TocAnchor, number>;
  let mdIndex = 1;
  const writeMd = (content: string) => {
    const name = `${String(mdIndex++).padStart(3, "0")}.md`;
    fs.writeFileSync(path.join(pagesDir, name), content, "utf8");
    sequence.push({ type: "markdown", file: name });
    return sequence.length - 1;
  };

  // PDF หน้า 1 = ปก (ใช้ React เหมือนเดิม) — ข้าม
  // PDF หน้า 2 = คำนำเต็มหน้า
  const pre = parsePrefacePage(pdfPages[1] ?? "");
  const prefaceParas = splitBodyToParagraphs(pre.body);
  const prefaceMd =
    wrapJson({
      kind: "preface-open",
      title: pre.title,
      quote: pre.quote,
    }) + prefaceParas.join("\n\n");
  tocAnchors.preface = writeMd(prefaceMd);

  // PDF หน้า 3 = สารบัญใน PDF — ใช้ TOC แบบคลิกได้ของแอป (โครงสร้างเดิม)
  sequence.push({ type: "toc" });

  for (let pi = 3; pi < pdfPages.length; pi++) {
    const text = pdfPages[pi];
    if (!text) continue;

    const epi = tryEpilogue(text);
    if (epi) {
      const paras = splitBodyToParagraphs(epi.body);
      const md =
        wrapJson({
          kind: "epilogue",
          showTitle: true,
          dropCap: true,
          titleLine: epi.titleLine,
        }) + paras.join("\n\n");
      tocAnchors.epilogue = writeMd(md);
      continue;
    }

    const ch = tryChapterStart(text);
    if (ch) {
      const paras = splitBodyToParagraphs(ch.body);
      const meta: Record<string, unknown> = {
        kind: "chapter-start",
        chapterNum: ch.chapterNum,
        titleLine: ch.titleLine,
        dropCap: true,
      };
      if (ch.subtitle) meta.subtitle = ch.subtitle;
      const md = wrapJson(meta) + paras.join("\n\n");
      const anchor = `ch${ch.chapterNum}` as TocAnchor;
      if (tocAnchors[anchor] === undefined) {
        tocAnchors[anchor] = sequence.length;
      }
      writeMd(md);
      continue;
    }

    const paras = splitBodyToParagraphs(text);
    const md = wrapJson({ kind: "body", dropCap: false }) + paras.join("\n\n");
    writeMd(md);
  }

  (["ch1", "ch2", "ch3", "ch4", "ch5", "ch6"] as const).forEach((k) => {
    if (tocAnchors[k] === undefined) {
      console.warn("warning: ไม่พบหน้าเปิดบทสำหรับ", k);
    }
  });

  sequence.push({ type: "end" });
  sequence.push({ type: "cover-back" });

  const manifest: PageManifest = {
    meta: {
      title: book.title,
      titleEn: book.titleEn,
      author: book.author,
      tocEntries: book.tocEntries,
    },
    tocAnchors,
    sequence,
  };

  fs.writeFileSync(
    path.join(root, "src/content/page-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );

  console.log("PDF pages:", pdfPages.length);
  console.log("Flip sequence length:", sequence.length);
  console.log("Markdown files:", mdIndex - 1);
  console.log("tocAnchors:", tocAnchors);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
