import { forwardRef } from "react";
import type { TocAnchor } from "../lib/paginate";
import { PageFrame } from "./PageFrame";

export type TocEntry = { label: string; anchor: TocAnchor };

type Props = {
  entries: TocEntry[];
  onJump: (anchor: TocAnchor) => void;
};

export const TableOfContents = forwardRef<HTMLDivElement, Props>(
  function TableOfContents({ entries, onJump }, ref) {
    return (
      <PageFrame ref={ref} variant="paper">
        <div className="flex h-full flex-col px-7 pb-14 pt-10 md:px-9 md:pt-12">
          <h2 className="font-display text-xl font-semibold text-ink">สารบัญ</h2>
          <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {entries.map((e) => (
              <button
                key={e.anchor}
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onJump(e.anchor);
                }}
                className="group rounded-md px-2 py-2.5 text-left font-serif text-sm leading-snug text-ink transition hover:bg-paper-300/40 md:text-[0.95rem]"
              >
                <span className="text-cover-accent group-hover:text-ink">
                  {e.label}
                </span>
              </button>
            ))}
          </nav>
          <p className="mt-2 font-serif text-xs text-ink-muted">
            แตะหัวข้อเพื่อไปยังหน้านั้น
          </p>
        </div>
      </PageFrame>
    );
  },
);
