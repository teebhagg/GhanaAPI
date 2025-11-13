declare module 'pdf-parse' {
  export interface PDFInfo {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata?: unknown;
    text: string;
    version: string;
  }

  function pdfParse(
    data: Buffer | Uint8Array,
    options?: Record<string, unknown>,
  ): Promise<PDFInfo>;

  export default pdfParse;
}
