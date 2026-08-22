export {
    createDocument,
    type PagieraBreakpoint,
    type PagieraDocument,
    type PagieraElement,
    type PagieraRootStyle,
} from "./document.js";
export { PagieraPage, type PagieraPageProps } from "./page.js";
export { PagieraEditor, type PagieraEditorAdapters, type PagieraEditorProps } from "./editor.js";
export type {
    PagieraAdapters,
    PagieraDataPreview,
    PagieraPageSummary,
    PagieraSaveResult,
} from "./adapters.js";
export { createPagieraClient, type PagieraClientOptions } from "./client.js";
export { PagieraProvider, usePagieraFonts, type PagieraFont, type PagieraResolvedFont } from "./provider.js";

export const PAGIERA_VERSION = "0.2.0-alpha.37";
