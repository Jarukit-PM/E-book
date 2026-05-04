/**
 * อ่าน raw.md แล้วสร้างไฟล์ src/content/pages/*.md (หนึ่งไฟล์ = หนึ่งหน้าใน flip book)
 * และอัปเดต src/content/page-manifest.json
 *
 * รัน: npm run generate:pages
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseBookFromRaw } from "../src/content/parseBook";
import type { ParsedBook } from "../src/content/parseBook";
import { buildPageSpecs, type PageSpec } from "../src/lib/paginate";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const rawPath = join(root, "raw.md");
const pagesDir = join(root, "src/content/pages");
const manifestPath = join(root, "src/content/page-manifest.json");

function wrapJson(meta: object): string {
  return `---json\n${JSON.stringify(meta)}\n---\n\n`;
}

function specToMd(spec: PageSpec, book: ParsedBook): string {
  switch (spec.kind) {
    case "preface-opening":
      return (
        wrapJson({
          kind: "preface-open",
          title: book.preface.titleLine,
          quote: book.preface.quote,
        }) + spec.openingParagraphs.join("\n\n")
      );
    case "preface-body":
      return wrapJson({ kind: "body", dropCap: false }) + spec.paragraphs.join("\n\n");
    case "chapter-body": {
      if (spec.opener) {
        const meta: Record<string, unknown> = {
          kind: "chapter-start",
          chapterNum: spec.opener.chapterNum,
          titleLine: spec.opener.titleLine,
          dropCap: spec.dropCap,
        };
        if (spec.opener.subtitle) meta.subtitle = spec.opener.subtitle;
        return wrapJson(meta) + spec.paragraphs.join("\n\n");
      }
      return wrapJson({ kind: "body", dropCap: spec.dropCap }) + spec.paragraphs.join("\n\n");
    }
    case "epilogue-body":
      return (
        wrapJson({
          kind: "epilogue",
          showTitle: spec.showTitle,
          dropCap: spec.dropCap,
          titleLine: book.epilogue.titleLine,
        }) + spec.paragraphs.join("\n\n")
      );
    default:
      throw new Error(`Unexpected spec in generator: ${(spec as PageSpec).kind}`);
  }
}

function main() {
  const raw = readFileSync(rawPath, "utf8");
  const book = parseBookFromRaw(raw);
  const { specs, anchorToIndex } = buildPageSpecs(book);

  try {
    rmSync(pagesDir, { recursive: true });
  } catch {
    /* ignore */
  }
  mkdirSync(pagesDir, { recursive: true });

  type Seq =
    | { type: "cover-front" }
    | { type: "cover-back" }
    | { type: "toc" }
    | { type: "end" }
    | { type: "markdown"; file: string };

  const sequence: Seq[] = [];
  let n = 1;

  for (const spec of specs) {
    switch (spec.kind) {
      case "cover-front":
        sequence.push({ type: "cover-front" });
        break;
      case "cover-back":
        sequence.push({ type: "cover-back" });
        break;
      case "toc":
        sequence.push({ type: "toc" });
        break;
      case "end":
        sequence.push({ type: "end" });
        break;
      case "preface-opening":
      case "preface-body":
      case "chapter-body":
      case "epilogue-body": {
        const name = `${String(n++).padStart(3, "0")}.md`;
        writeFileSync(join(pagesDir, name), specToMd(spec, book), "utf8");
        sequence.push({ type: "markdown", file: name });
        break;
      }
    }
  }

  const manifest = {
    meta: {
      title: book.title,
      titleEn: book.titleEn,
      author: book.author,
      tocEntries: book.tocEntries,
    },
    tocAnchors: anchorToIndex,
    sequence,
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  const count = readdirSync(pagesDir).filter((f) => f.endsWith(".md")).length;
  console.log(`Wrote ${count} markdown page(s) to src/content/pages/`);
  console.log(`Wrote ${manifestPath}`);
}

main();
