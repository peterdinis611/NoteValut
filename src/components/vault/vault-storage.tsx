"use client";

import { useAppwrite, useUser } from "@appwrite.io/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  FileUp,
  GripVertical,
  HardDrive,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend, NativeTypes } from "react-dnd-html5-backend";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteVaultFile,
  formatFileSize,
  getVaultFilePreviewUrl,
  getVaultFileViewUrl,
  listVaultFiles,
  uploadVaultFile,
  type VaultFile,
  VAULT_BUCKET_ID,
} from "@/lib/appwrite/storage";
import { runPromise } from "@/lib/effect";
import { cn } from "cn";
import { ScrollPane } from "./scroll-to-top";

const FILE_CARD = "VAULT_FILE_CARD" as const;

const ACCEPTED =
  ".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.md,.csv,.json";

const isImage = (name: string) =>
  /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

function moveItem<T>(list: T[], from: number, to: number) {
  if (from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (!item) return list;
  next.splice(to, 0, item);
  return next;
}

function FileDropZone({
  disabled,
  busy,
  onFiles,
}: {
  disabled?: boolean;
  busy?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop: (item: { files?: FileList | File[] }) => {
        if (disabled) return;
        const list = item.files
          ? Array.from(item.files as FileList | File[])
          : [];
        if (list.length > 0) onFiles(list);
      },
      canDrop: () => !disabled,
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [disabled, onFiles],
  );

  const active = isOver && canDrop;

  return (
    <motion.div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      animate={
        reduceMotion
          ? undefined
          : { scale: active ? 1.01 : 1, borderColor: active ? undefined : undefined }
      }
      className={cn(
        "relative flex min-h-[180px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[16px] border border-dashed px-6 py-10 text-center transition-colors",
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-muted/25 hover:border-primary/40 hover:bg-muted/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 65%)",
        }}
      />
      <span
        className={cn(
          "relative flex size-12 items-center justify-center rounded-[12px] border text-foreground",
          active
            ? "border-primary/40 bg-background"
            : "border-border bg-background/70",
        )}
      >
        {busy ? (
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="size-5" />
        )}
      </span>
      <div className="relative">
        <p className="font-display text-lg tracking-tight text-foreground">
          {active ? "Drop to upload" : "Drag files here"}
        </p>
        <p className="mt-1 max-w-sm text-[13px] text-foreground/60">
          Images, PDF, markdown, CSV, JSON — up to 10&nbsp;MB each. Or use the
          button below.
        </p>
      </div>
    </motion.div>
  );
}

function StorageFileCard({
  file,
  index,
  previewUrl,
  viewUrl,
  busy,
  onDelete,
  onMove,
}: {
  file: VaultFile;
  index: number;
  previewUrl: string;
  viewUrl: string;
  busy?: boolean;
  onDelete: (id: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: FILE_CARD,
      item: { id: file.$id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [file.$id, index],
  );

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: FILE_CARD,
      hover: (item: { id: string; index: number }) => {
        if (item.index === index) return;
        onMove(item.index, index);
        item.index = index;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
    }),
    [index, onMove],
  );

  preview(drop(drag(ref)));

  return (
    <div
      ref={ref}
      className={cn(
        "group flex cursor-grab items-center gap-3 rounded-[12px] border bg-card px-3 py-2.5 shadow-sm transition-[opacity,box-shadow,border-color] active:cursor-grabbing",
        isDragging && "opacity-40",
        isOver
          ? "border-primary/45 shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent)]"
          : "border-border",
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100">
        <GripVertical className="size-3.5" />
      </span>
      {isImage(file.name) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          className="size-11 shrink-0 rounded-[8px] object-cover ring-1 ring-border"
          draggable={false}
        />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-muted font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {file.name.split(".").pop() ?? "file"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <a
          href={viewUrl}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-[14px] font-medium text-foreground hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {file.name}
        </a>
        <p className="mt-0.5 text-[11px] text-foreground/55">
          {formatFileSize(file.sizeOriginal)} ·{" "}
          {new Date(file.$createdAt).toLocaleString()}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={busy}
        onClick={() => onDelete(file.$id)}
        aria-label={`Delete ${file.name}`}
        className="shrink-0"
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </div>
  );
}

function VaultStorageInner() {
  const reduceMotion = useReducedMotion();
  const { storage } = useAppwrite();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refreshFiles = useCallback(() => {
    if (!user) {
      setFiles([]);
      return;
    }
    setLoading(true);
    setError(null);
    startTransition(() => {
      void runPromise(listVaultFiles(storage))
        .then((list) => setFiles(list))
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    });
  }, [storage, user]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const uploadMany = useCallback(
    (incoming: File[]) => {
      if (!user || incoming.length === 0) return;
      setError(null);
      setMessage(null);
      startTransition(() => {
        void (async () => {
          try {
            for (const file of incoming) {
              await runPromise(uploadVaultFile(storage, user.$id, file));
            }
            setMessage(
              incoming.length === 1
                ? `Uploaded ${incoming[0]!.name}`
                : `Uploaded ${incoming.length} files`,
            );
            refreshFiles();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
          }
        })();
      });
    },
    [refreshFiles, storage, user],
  );

  const onDelete = (fileId: string) => {
    setError(null);
    startTransition(() => {
      void runPromise(deleteVaultFile(storage, fileId))
        .then(() => {
          setMessage("File deleted");
          setFiles((prev) => prev.filter((file) => file.$id !== fileId));
        })
        .catch((err: Error) => setError(err.message));
    });
  };

  const onMove = useCallback((from: number, to: number) => {
    setFiles((prev) => moveItem(prev, from, to));
  }, []);

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 40% at 90% 0%, color-mix(in oklch, var(--accent) 40%, transparent), transparent 55%)",
        }}
      />

      <header className="relative z-10 border-b border-border px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-foreground/55 uppercase">
              Appwrite files
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight text-foreground md:text-4xl">
              Storage
            </h1>
            <p className="mt-2 max-w-lg text-[14px] text-foreground/65">
              Drag files onto the shelf, reorder cards, open previews. Bucket{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                {VAULT_BUCKET_ID}
              </code>
            </p>
          </div>
          <Badge variant="secondary" className="rounded-[6px] font-mono text-[11px]">
            <HardDrive className="size-3" />
            {files.length} file{files.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </header>

      <ScrollPane className="relative z-10 px-6 py-6 md:px-10">
        <div className="mx-auto max-w-2xl space-y-5">
          {!user ? (
            <Alert>
              <AlertTitle>Sign in required</AlertTitle>
              <AlertDescription>
                File uploads sync to your Appwrite account. Open /vault while
                signed in to manage storage.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <FileDropZone
                disabled={!user || isPending}
                busy={isPending}
                onFiles={uploadMany}
              />

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept={ACCEPTED}
                  onChange={(event) => {
                    uploadMany(Array.from(event.target.files ?? []));
                    event.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl"
                >
                  {isPending ? (
                    <LoaderCircle
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <FileUp data-icon="inline-start" />
                  )}
                  Browse files
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || isPending}
                  onClick={refreshFiles}
                  className="rounded-xl"
                >
                  Refresh
                </Button>
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Storage error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {message ? (
                <p className="text-[13px] text-foreground/60">{message}</p>
              ) : null}

              <div className="space-y-2">
                <p className="font-mono text-[10px] tracking-[0.16em] text-foreground/50 uppercase">
                  Library · drag to reorder
                </p>
                {loading && files.length === 0 ? (
                  <p className="text-sm text-foreground/55">Loading files…</p>
                ) : files.length === 0 ? (
                  <p className="rounded-[12px] border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-foreground/55">
                    No files yet. Drop a screenshot, brief PDF, or markdown note
                    above.
                  </p>
                ) : (
                  <AnimatePresence initial={false}>
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <motion.li
                          key={file.$id}
                          layout={!reduceMotion}
                          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            reduceMotion ? undefined : { opacity: 0, x: -8 }
                          }
                        >
                          <StorageFileCard
                            file={file}
                            index={index}
                            previewUrl={getVaultFilePreviewUrl(
                              storage,
                              file.$id,
                              72,
                            )}
                            viewUrl={getVaultFileViewUrl(storage, file.$id)}
                            busy={isPending}
                            onDelete={onDelete}
                            onMove={onMove}
                          />
                        </motion.li>
                      ))}
                    </ul>
                  </AnimatePresence>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollPane>
    </motion.section>
  );
}

export function VaultStorage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <VaultStorageInner />
    </DndProvider>
  );
}
