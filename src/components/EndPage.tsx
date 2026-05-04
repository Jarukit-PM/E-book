import { forwardRef } from "react";
import { PageFrame } from "./PageFrame";

export const EndPage = forwardRef<
  HTMLDivElement,
  { bookPageNumber?: number }
>(function EndPage({ bookPageNumber }, ref) {
    return (
      <PageFrame ref={ref} variant="paper" bookPageNumber={bookPageNumber}>
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="font-display text-2xl text-ink">ขอบคุณที่อ่าน</p>
          <p className="mt-4 font-serif text-sm text-ink-muted">
            (จบ E-Book)
          </p>
        </div>
      </PageFrame>
    );
  },
);
