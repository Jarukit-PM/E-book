import { forwardRef, type ReactNode } from "react";

type Variant = "paper" | "cover" | "coverBack";

type PageFrameProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** เลขหน้าในเล่ม (1 = หน้าแรกของ flip) — แสดงมุมล่าง */
  bookPageNumber?: number;
};

export const PageFrame = forwardRef<HTMLDivElement, PageFrameProps>(
  function PageFrame(
    { children, variant = "paper", className = "", bookPageNumber },
    ref,
  ) {
    const base =
      variant === "paper"
        ? "page-paper text-ink"
        : variant === "cover"
          ? "page-cover-front"
          : "page-cover-back";

    const isPaper = variant === "paper";
    const footer =
      typeof bookPageNumber === "number" ? (
        <div
          className={`pointer-events-none absolute bottom-2.5 right-3 z-10 select-none font-display text-[11px] tabular-nums tracking-wide md:bottom-3 md:right-4 md:text-xs ${
            isPaper
              ? "text-ink/80"
              : "text-paper-200/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
          }`}
          aria-hidden
        >
          {bookPageNumber}
        </div>
      ) : null;

    return (
      <div ref={ref} className={`page-frame ${base} ${className}`.trim()}>
        {children}
        {footer}
      </div>
    );
  },
);
