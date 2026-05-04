import { ChevronLeft, ChevronRight, Home } from "lucide-react";

type Props = {
  currentIndex: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  onHome: () => void;
};

export function Controls({
  currentIndex,
  pageCount,
  onPrev,
  onNext,
  onHome,
}: Props) {
  const pct =
    pageCount > 0 ? Math.round(((currentIndex + 1) / pageCount) * 100) : 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 pb-4 pt-2 md:pb-6">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-paper-300/50 bg-cover/90 px-2 py-2 shadow-book backdrop-blur-sm">
        <button
          type="button"
          onClick={onHome}
          className="rounded-full p-2.5 text-paper-100 transition hover:bg-white/10"
          aria-label="กลับหน้าปก"
        >
          <Home className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex <= 0}
          className="rounded-full p-2.5 text-paper-100 transition enabled:hover:bg-white/10 disabled:opacity-30"
          aria-label="หน้าก่อน"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="min-w-[5.5rem] text-center font-serif text-sm tabular-nums text-paper-100">
          {currentIndex + 1} / {pageCount}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentIndex >= pageCount - 1}
          className="rounded-full p-2.5 text-paper-100 transition enabled:hover:bg-white/10 disabled:opacity-30"
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
      <div className="h-1 w-[min(92vw,28rem)] overflow-hidden rounded-full bg-black/25">
        <div
          className="h-full rounded-full bg-cover-gold transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
