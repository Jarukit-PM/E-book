import HTMLFlipBook from "react-pageflip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import pageManifest from "./content/page-manifest.json";
import type { PageManifest, ManifestSequenceItem } from "./content/manifest.types";
import { CoverBack, CoverFront } from "./components/Cover";
import {
  TableOfContents,
  type TocEntry,
} from "./components/TableOfContents";
import { PaperFromMarkdown } from "./components/PaperFromMarkdown";
import { EndPage } from "./components/EndPage";
import { Controls } from "./components/Controls";
import type { TocAnchor } from "./lib/paginate";

const manifest = pageManifest as PageManifest;

type PageFlipApi = {
  flip: (n: number, corner?: "top" | "bottom") => void;
  flipNext: (corner?: "top" | "bottom") => void;
  flipPrev: (corner?: "top" | "bottom") => void;
};

const TOC_ANCHORS: TocAnchor[] = [
  "preface",
  "ch1",
  "ch2",
  "ch3",
  "ch4",
  "ch5",
  "ch6",
  "epilogue",
];

function buildTocEntries(m: PageManifest): TocEntry[] {
  return TOC_ANCHORS.map((anchor, i) => {
    const flipIndex = m.tocAnchors[anchor];
    if (typeof flipIndex !== "number") return null;
    const label = m.meta.tocEntries[i] ?? anchor;
    return { label, anchor, displayPage: flipIndex + 1 };
  }).filter((x): x is TocEntry => x !== null);
}

function computeFlipDims(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 480, height: 680 };
  }
  const narrow = window.innerWidth < 640;
  const w = narrow
    ? Math.max(280, Math.min(window.innerWidth - 20, 420))
    : Math.min(520, Math.max(400, Math.floor(window.innerWidth / 2.15)));
  const h = narrow
    ? Math.max(420, Math.min(window.innerHeight * 0.58, 640))
    : Math.min(760, Math.max(520, Math.floor(window.innerHeight * 0.72)));
  return { width: w, height: h };
}

function collectMarkdownModules() {
  const rawGlob = import.meta.glob<string>("./content/pages/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  });
  const byFile = new Map<string, string>();
  for (const [path, mod] of Object.entries(rawGlob)) {
    const parts = path.split("/");
    const file = parts[parts.length - 1];
    if (file) byFile.set(file, mod);
  }
  return byFile;
}

function renderSequenceItem(
  item: ManifestSequenceItem,
  index: number,
  mdByFile: Map<string, string>,
  ctx: { onJump: (a: TocAnchor) => void; tocEntries: TocEntry[]; meta: PageManifest["meta"] },
) {
  const key = `page-${index}`;
  switch (item.type) {
    case "cover-front":
      return (
        <CoverFront
          key={key}
          book={ctx.meta}
          bookPageNumber={index + 1}
        />
      );
    case "cover-back":
      return <CoverBack key={key} bookPageNumber={index + 1} />;
    case "toc":
      return (
        <TableOfContents
          key={key}
          entries={ctx.tocEntries}
          onJump={ctx.onJump}
          bookPageNumber={index + 1}
        />
      );
    case "end":
      return <EndPage key={key} bookPageNumber={index + 1} />;
    case "markdown": {
      const src = mdByFile.get(item.file);
      const n = index + 1;
      if (src === undefined) {
        console.error(`Missing markdown: ${item.file}`);
        return (
          <PaperFromMarkdown
            key={key}
            bookPageNumber={n}
            source={`---json\n${JSON.stringify({ kind: "body", dropCap: false })}\n---\n\n(ไม่พบไฟล์ ${item.file})`}
          />
        );
      }
      return <PaperFromMarkdown key={key} bookPageNumber={n} source={src} />;
    }
    default:
      return null;
  }
}

export default function App() {
  const bookRef = useRef<{ pageFlip: () => PageFlipApi } | null>(null);
  const mdByFile = useMemo(() => collectMarkdownModules(), []);
  const tocEntries = useMemo(() => buildTocEntries(manifest), []);
  const anchorToIndex = manifest.tocAnchors;
  const sequence = manifest.sequence;

  const [page, setPage] = useState(0);
  const [dims, setDims] = useState(computeFlipDims);

  const pageCount = sequence.length;
  const pageCountRef = useRef(pageCount);
  pageCountRef.current = pageCount;

  const flipTo = useCallback((index: number) => {
    const api = bookRef.current?.pageFlip();
    if (!api) return;
    const clamped = Math.max(
      0,
      Math.min(pageCountRef.current - 1, index),
    );
    api.flip(clamped);
  }, []);

  const onJumpStable = useCallback(
    (anchor: TocAnchor) => {
      const idx = anchorToIndex[anchor];
      if (idx === undefined) return;
      const api = bookRef.current?.pageFlip();
      if (!api) return;
      const clamped = Math.max(
        0,
        Math.min(pageCountRef.current - 1, idx),
      );
      api.flip(clamped);
    },
    [anchorToIndex],
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDims((prev) => {
          const next = computeFlipDims();
          if (prev.width === next.width && prev.height === next.height) {
            return prev;
          }
          return next;
        });
      }, 150);
    };
    window.addEventListener("resize", schedule);
    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        bookRef.current?.pageFlip()?.flipNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        bookRef.current?.pageFlip()?.flipPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ctx = useMemo(
    () => ({
      onJump: onJumpStable,
      tocEntries,
      meta: manifest.meta,
    }),
    [onJumpStable, tocEntries],
  );

  const handleInit = useCallback((e: { data: unknown }) => {
    const d = e.data;
    if (d && typeof d === "object" && "page" in d) {
      const p = (d as { page: unknown }).page;
      if (typeof p === "number") setPage(p);
    }
  }, []);

  const handleFlip = useCallback((e: { data: unknown }) => {
    setPage(typeof e.data === "number" ? e.data : 0);
  }, []);

  const pages = useMemo(
    () =>
      sequence.map((item, i) =>
        renderSequenceItem(item, i, mdByFile, ctx),
      ),
    [sequence, mdByFile, ctx],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-4 py-3 text-center md:py-4">
        <p className="font-display text-xs tracking-[0.2em] text-paper-300/90">
          Interactive E-Book
        </p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-1 pb-32 pt-1 md:px-4 md:pb-36">
        <HTMLFlipBook
          key={`flip-${dims.width}-${dims.height}`}
          ref={bookRef}
          className="stf-book"
          style={{ marginLeft: "auto", marginRight: "auto" }}
          width={dims.width}
          height={dims.height}
          minWidth={280}
          maxWidth={1200}
          minHeight={400}
          maxHeight={900}
          maxShadowOpacity={0.55}
          drawShadow
          flippingTime={780}
          usePortrait
          startPage={0}
          startZIndex={0}
          autoSize
          size="stretch"
          showCover
          mobileScrollSupport
          clickEventForward
          useMouseEvents
          swipeDistance={28}
          showPageCorners
          disableFlipByClick={false}
          onInit={handleInit}
          onFlip={handleFlip}
        >
          {pages}
        </HTMLFlipBook>
      </main>

      <Controls
        currentIndex={page}
        pageCount={pageCount}
        onPrev={() => bookRef.current?.pageFlip()?.flipPrev()}
        onNext={() => bookRef.current?.pageFlip()?.flipNext()}
        onHome={() => flipTo(0)}
      />
    </div>
  );
}
