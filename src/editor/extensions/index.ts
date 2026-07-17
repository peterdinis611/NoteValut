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
import { TableBlock, VideoBlock, WebLink } from "./rich";
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
  Callout,
  TableBlock,
  PageLink,
  WebLink,
  VideoBlock,
  ImageBlock,
  Toggle,
  CustomBlock,
  Divider,
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
  Callout,
  TableBlock,
  PageLink,
  WebLink,
  VideoBlock,
  ImageBlock,
  Toggle,
  CustomBlock,
  Divider,
};
