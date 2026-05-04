import { forwardRef, type ReactNode } from "react";

type Variant = "paper" | "cover" | "coverBack";

type PageFrameProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

export const PageFrame = forwardRef<HTMLDivElement, PageFrameProps>(
  function PageFrame({ children, variant = "paper", className = "" }, ref) {
    const base =
      variant === "paper"
        ? "page-paper text-ink"
        : variant === "cover"
          ? "page-cover-front"
          : "page-cover-back";

    return (
      <div ref={ref} className={`page-frame ${base} ${className}`.trim()}>
        {children}
      </div>
    );
  },
);
