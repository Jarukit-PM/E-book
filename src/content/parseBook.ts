export type Chapter = {
  num: number;
  titleLine: string;
  subtitle?: string;
  paragraphs: string[];
};

export type ParsedBook = {
  title: string;
  titleEn: string;
  author: string;
  preface: {
    titleLine: string;
    quote: string;
    paragraphs: string[];
  };
  tocEntries: string[];
  chapters: Chapter[];
  epilogue: { titleLine: string; paragraphs: string[] };
};

export function parseBookFromRaw(raw: string): ParsedBook {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const title = lines[0] ?? "";
  const titleEn = lines[1] ?? "";
  const author = (lines[2] ?? "").replace(/^ผู้เขียน:\s*/, "");

  const tocIdx = lines.indexOf("สารบัญ");
  if (tocIdx < 0) {
    throw new Error("ไม่พบหัวข้อ 'สารบัญ' ใน raw.md");
  }

  const prefaceTitleLine = lines[3] ?? "";
  const quote = lines[4] ?? "";
  const prefaceBody = lines.slice(5, tocIdx);

  // สารบัญใน raw มีบรรทัด "บทที่ 1: …" เป็นหัวข้อในรายการด้วย
  // จุดเริ่มเนื้อหาจริงคือ "บทที่ 1:" ที่บรรทัดถัดไปเป็นวงเล็บบรรทัดย่อย (รูปแบบเปิดบท)
  const bodyStart = findChapterOneBodyStart(lines, tocIdx);
  if (bodyStart < 0) {
    throw new Error("ไม่พบจุดเริ่มเนื้อหาบทที่ 1");
  }

  const tocEntries = lines.slice(tocIdx + 1, bodyStart);

  const { chapters, epilogue } = parseChaptersAndEpilogue(lines, bodyStart);

  return {
    title,
    titleEn,
    author,
    preface: {
      titleLine: prefaceTitleLine,
      quote,
      paragraphs: prefaceBody,
    },
    tocEntries,
    chapters,
    epilogue,
  };
}

/** หา index ของบรรทัดเปิดบทที่ 1 ในเนื้อหา (ไม่ใช่แถวชื่อบทในสารบัญ) */
function findChapterOneBodyStart(lines: string[], tocIdx: number): number {
  for (let i = tocIdx + 1; i < lines.length; i++) {
    if (!/^บทที่ 1:/.test(lines[i] ?? "")) continue;
    const next = lines[i + 1];
    if (next?.startsWith("(")) return i;
  }
  return lines.findIndex((l, i) => i > tocIdx && /^บทที่ 1:/.test(l));
}

function parseChaptersAndEpilogue(
  lines: string[],
  start: number,
): {
  chapters: Chapter[];
  epilogue: { titleLine: string; paragraphs: string[] };
} {
  const chapters: Chapter[] = [];
  let i = start;
  let epilogue: { titleLine: string; paragraphs: string[] } | null = null;

  while (i < lines.length) {
    const line = lines[i];
    if (line === "(จบ E-Book)" || line.startsWith("(จบ")) {
      break;
    }

    const epMatch = line.match(/^บทส่งท้าย:/);
    if (epMatch) {
      const titleLine = line;
      i++;
      const paras: string[] = [];
      while (i < lines.length && lines[i] !== "(จบ E-Book)" && !lines[i].startsWith("(จบ")) {
        if (lines[i].trim()) paras.push(lines[i]);
        i++;
      }
      epilogue = { titleLine, paragraphs: paras };
      break;
    }

    const chMatch = line.match(/^บทที่ (\d+):/);
    if (chMatch) {
      const num = Number(chMatch[1]);
      const titleLine = line;
      i++;
      let subtitle: string | undefined;
      if (i < lines.length && lines[i].startsWith("(")) {
        subtitle = lines[i];
        i++;
      }
      const paras: string[] = [];
      while (i < lines.length) {
        const next = lines[i];
        if (
          /^บทที่ \d+:/.test(next) ||
          next.startsWith("บทส่งท้าย:") ||
          next === "(จบ E-Book)" ||
          next.startsWith("(จบ")
        ) {
          break;
        }
        if (next.trim()) paras.push(next);
        i++;
      }
      chapters.push({ num, titleLine, subtitle, paragraphs: paras });
      continue;
    }

    i++;
  }

  if (!epilogue) {
    epilogue = { titleLine: "บทส่งท้าย", paragraphs: [] };
  }

  return { chapters, epilogue };
}
