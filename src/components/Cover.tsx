import { forwardRef } from "react";
import type { PageManifest } from "../content/manifest.types";
import { PageFrame } from "./PageFrame";
import coverArt from "../asset/Main.png";

type BookMeta = PageManifest["meta"];

export const CoverFront = forwardRef<
  HTMLDivElement,
  { book: BookMeta; bookPageNumber?: number }
>(function CoverFront({ book, bookPageNumber }, ref) {
    return (
      <PageFrame ref={ref} variant="cover" bookPageNumber={bookPageNumber}>
        <div className="flex h-full min-h-0 flex-col p-2 md:p-3">
          <p className="shrink-0 text-center font-display text-[10px] tracking-[0.35em] text-cover-gold/90 md:text-xs">
            E-BOOK
          </p>
          <div className="relative min-h-0 flex-1 py-1">
            <img
              src={coverArt}
              alt={book.title}
              className="h-full w-full object-contain object-center drop-shadow-md"
            />
          </div>
          <p className="shrink-0 pt-1 text-center font-serif text-[10px] text-paper-300/85 md:text-xs">
            พลิกมุมขวาล่างเพื่อเปิดอ่าน
          </p>
        </div>
      </PageFrame>
    );
  },
);

export const CoverBack = forwardRef<
  HTMLDivElement,
  { bookPageNumber?: number }
>(function CoverBack({ bookPageNumber }, ref) {
    return (
      <PageFrame ref={ref} variant="coverBack" bookPageNumber={bookPageNumber}>
        <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
          <p className="font-display text-2xl text-paper-100">จบ E-Book</p>
          <p className="font-serif text-sm text-paper-300">
            ขอให้วัยรุ่นทุกคนอยู่รอดปลอดภัยในยุคโลกเดือด
          </p>
          <div className="mt-4 h-px w-24 bg-cover-gold/50" />
        </div>
      </PageFrame>
    );
  },
);
