import type { TocAnchor } from "../lib/paginate";

export type ManifestSequenceItem =
  | { type: "cover-front" }
  | { type: "cover-back" }
  | { type: "toc" }
  | { type: "end" }
  | { type: "markdown"; file: string };

export type PageManifest = {
  meta: {
    title: string;
    titleEn: string;
    author: string;
    tocEntries: string[];
  };
  tocAnchors: Record<TocAnchor, number>;
  sequence: ManifestSequenceItem[];
};
