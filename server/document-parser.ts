import { PDFParse } from "pdf-parse";

export interface ParsedDocumentPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  text: string;
  pages: ParsedDocumentPage[];
  textSource: "pdf" | "text" | "preview" | "none";
}

export async function parseDocumentContent(
  bytes: Buffer | null,
  mimeType: string | undefined,
  contentPreview: string | undefined,
): Promise<ParsedDocument> {
  if (!bytes) {
    return previewOnly(contentPreview);
  }

  if (mimeType?.includes("pdf")) {
    try {
      const parser = new PDFParse({ data: bytes });
      const info = await parser.getInfo({ parsePageInfo: true });
      const totalPages = Math.max(info.total || 0, 1);
      const pages: ParsedDocumentPage[] = [];

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        const pageResult = await parser.getText({ partial: [pageNumber] });
        const pageText = pageResult.text.trim();
        pages.push({
          pageNumber,
          text: pageText,
        });
      }

      await parser.destroy();

      return {
        text: pages.map((page) => `Page ${page.pageNumber}\n${page.text}`).join("\n\n"),
        pages,
        textSource: "pdf",
      };
    } catch {
      return previewOnly(contentPreview);
    }
  }

  if (
    mimeType?.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType?.includes("xml")
  ) {
    const text = bytes.toString("utf8");
    return {
      text,
      pages: [{ pageNumber: 1, text }],
      textSource: "text",
    };
  }

  return previewOnly(contentPreview);
}

function previewOnly(contentPreview: string | undefined): ParsedDocument {
  const preview = contentPreview ?? "";
  return {
    text: preview,
    pages: preview ? [{ pageNumber: 1, text: preview }] : [],
    textSource: preview ? "preview" : "none",
  };
}
