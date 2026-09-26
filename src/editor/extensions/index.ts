import {
  BulletList,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Paragraph,
  Quote,
  Todo,
} from "./basic";
import { Callout, Divider, PageLink } from "./advanced";
import { ImageBlock, NumberedList, Toggle } from "./extra";
import { CustomBlock } from "./custom";
import { TableBlock, VideoBlock, WebLink, PdfBlock, FileBlock } from "./rich";
import { CanvasBlock } from "./canvas";
import { MathBlock, SyncedBlock } from "./math-synced";
import { TemplateInsert } from "./template-insert";
import type { Extension } from "../types";

/** Default NoteVault starter kit — TipTap-style bundle of block extensions. */
export const StarterKit: Extension[] = [
  Paragraph,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  BulletList,
  NumberedList,
  Todo,
  Quote,
  Code,
  MathBlock,
  Callout,
  TableBlock,
  PageLink,
  WebLink,
  VideoBlock,
  PdfBlock,
  FileBlock,
  ImageBlock,
  CanvasBlock,
  SyncedBlock,
  Toggle,
  CustomBlock,
  Divider,
  TemplateInsert,
];

export {
  Paragraph,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  BulletList,
  NumberedList,
  Todo,
  Quote,
  Code,
  MathBlock,
  Callout,
  TableBlock,
  PageLink,
  WebLink,
  VideoBlock,
  PdfBlock,
  FileBlock,
  ImageBlock,
  CanvasBlock,
  SyncedBlock,
  Toggle,
  CustomBlock,
  Divider,
};
