import { forwardRef } from "react";
import type { TocAnchor } from "../lib/paginate";
import { PageFrame } from "./PageFrame";

export type TocEntry = {
  label: string;
  anchor: TocAnchor;
  /** เลขลำดับหน้าใน flip book (1 = หน้าแรกหลังปก) */
  displayPage: number;
};

type Props = {
  entries: TocEntry[];
  onJump: (anchor: TocAnchor) => void;
  /** เลขหน้าของแผ่นสารบัญเอง */
  bookPageNumber?: number;
};

export const TableOfContents = forwardRef<HTMLDivElement, Props>(
  function TableOfContents({ entries, onJump, bookPageNumber }, ref) {
    return (
      <PageFrame ref={ref} variant="paper" bookPageNumber={bookPageNumber}>
        <div className="flex h-full flex-col px-7 pb-16 pt-10 md:px-9 md:pt-12">
          <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">
            สารบัญ
          </h2>
          <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto pr-1">
            {entries.map((e) => (
              <button
                key={e.anchor}
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onJump(e.anchor);
                }}
                className="group w-full rounded-md px-2 py-2.5 text-left transition hover:bg-paper-300/50 md:py-3"
              >
                <span className="flex w-full min-w-0 items-end gap-2">
                  <span className="min-w-0 flex-1 font-serif text-[0.95rem] font-medium leading-snug text-ink md:text-base">
                    {e.label}
                  </span>
                  <span
                    className="mb-[0.35em] min-w-[1.25rem] flex-1 border-b border-dotted border-ink/25"
                    aria-hidden
                  />
                  <span className="shrink-0 whitespace-nowrap font-display text-sm tabular-nums font-semibold text-ink md:text-base">
                    หน้า {e.displayPage}
                  </span>
                </span>
              </button>
            ))}
          </nav>
          <p className="mt-3 font-serif text-xs leading-relaxed text-ink-muted md:text-sm">
            ตัวเลขคือลำดับหน้าในเล่ม (รวมปก) — แตะหัวข้อเพื่อเปิดหน้านั้น
          </p>
        </div>
      </PageFrame>
    );
  },
);
