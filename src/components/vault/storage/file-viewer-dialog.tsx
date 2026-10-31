"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFileSize, type VaultFile } from "@/lib/appwrite/storage";
import {
  fileKindLabel,
  getVaultFileKind,
  type VaultFileKind,
} from "@/lib/vault/file-kinds";
import { CsvViewer } from "./viewers/csv-viewer";
import { DocxViewer } from "./viewers/docx-viewer";
import { ImageViewer } from "./viewers/image-viewer";
import { JsonViewer } from "./viewers/json-viewer";
import { MarkdownViewer } from "./viewers/markdown-viewer";
import { PdfViewer } from "./viewers/pdf-viewer";
import { TextViewer } from "./viewers/text-viewer";
import { vaultFileUrl } from "./viewers/use-vault-file";
import { ViewerError } from "./viewers/viewer-shell";
import { XmlViewer } from "./viewers/xml-viewer";

function KindViewer({
  kind,
  fileId,
  fileName,
}: {
  kind: VaultFileKind;
  fileId: string;
  fileName: string;
}) {
  switch (kind) {
    case "pdf":
      return <PdfViewer fileId={fileId} fileName={fileName} />;
    case "txt":
      return <TextViewer fileId={fileId} />;
    case "md":
      return <MarkdownViewer fileId={fileId} />;
    case "csv":
      return <CsvViewer fileId={fileId} />;
    case "xml":
      return <XmlViewer fileId={fileId} />;
    case "json":
      return <JsonViewer fileId={fileId} />;
    case "docx":
      return <DocxViewer fileId={fileId} />;
    case "image":
      return <ImageViewer fileId={fileId} fileName={fileName} />;
    default:
      return (
        <ViewerError message="No built-in viewer for this file type. Open it in a new tab instead." />
      );
  }
}

export function FileViewerDialog({
  file,
  open,
  onOpenChange,
}: {
  file: VaultFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const kind = file ? getVaultFileKind(file.name) : "other";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-hidden sm:max-w-3xl"
        showCloseButton
      >
        {file ? (
          <>
            <DialogHeader className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full font-mono text-[10px] uppercase tracking-wide"
                >
                  {fileKindLabel(kind)}
                </Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatFileSize(file.sizeOriginal)}
                </span>
              </div>
              <DialogTitle className="truncate font-display text-xl tracking-tight">
                {file.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                In-app preview for {file.name}
              </DialogDescription>
            </DialogHeader>

            <KindViewer kind={kind} fileId={file.$id} fileName={file.name} />

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                Viewer · {fileKindLabel(kind)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                render={
                  <a
                    href={vaultFileUrl(file.$id)}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <ExternalLink data-icon="inline-start" />
                Open raw
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
