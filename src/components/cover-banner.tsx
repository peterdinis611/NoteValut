"use client";

import { COVER_GALLERY, COVER_GRADIENTS } from "@/lib/blocks";
import { firstIssue, parseCoverImage } from "@/lib/validation";
import { useVaultUpload } from "@/hooks/use-vault-upload";
import { Dices, ImageIcon, Link2, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  coverColor?: string;
  coverImage?: string;
  readOnly?: boolean;
  /** Show compact placeholder when empty */
  compactEmpty?: boolean;
  className?: string;
  onSetCoverColor: (color: string | null) => void;
  onSetCoverImage: (url: string | null) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
};

function randomPicsumUrl() {
  const seed = Math.random().toString(36).slice(2, 10);
  return `https://picsum.photos/seed/${seed}/1600/900`;
}

export function CoverBanner({
  coverColor,
  coverImage,
  readOnly = false,
  compactEmpty = true,
  className = "",
  onSetCoverColor,
  onSetCoverImage,
  onError,
  onSuccess,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [imageDraft, setImageDraft] = useState(coverImage ?? "");
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickingRandom, setPickingRandom] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { uploadFile } = useVaultUpload();

  const hasCover = !!(coverImage || coverColor);

  useEffect(() => {
    setImageDraft(coverImage ?? "");
  }, [coverImage]);

  useEffect(() => {
    if (!showPicker) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target || rootRef.current?.contains(target)) return;
      setShowPicker(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowPicker(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showPicker]);

  function applyImageUrl() {
    const trimmed = imageDraft.trim();
    if (!trimmed) {
      onSetCoverImage(null);
      setImageError(null);
      return;
    }
    const parsed = parseCoverImage(trimmed);
    if (!parsed.success) {
      setImageError(firstIssue(parsed));
      return;
    }
    setImageError(null);
    onSetCoverColor(null);
    onSetCoverImage(parsed.output);
    onSuccess?.("Cover image saved");
  }

  async function upload(file: File | null) {
    if (!file || readOnly) return;
    if (!file.type.startsWith("image/")) {
      onError?.("Choose an image file (PNG, JPG, WebP…)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      onError?.("Image is too large (max 8 MB)");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setImageDraft(uploaded.url);
      setImageError(null);
      onSetCoverColor(null);
      onSetCoverImage(uploaded.url);
      setShowPicker(true);
      onSuccess?.("Cover uploaded");
    } catch {
      onError?.("Couldn’t upload cover image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function pickRandomPicsum() {
    setPickingRandom(true);
    setImageError(null);
    try {
      const url = randomPicsumUrl();
      // Warm the image so the cover paints immediately
      await new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = url;
      });
      setImageDraft(url);
      onSetCoverColor(null);
      onSetCoverImage(url);
      onSuccess?.("Random cover applied");
    } catch {
      onError?.("Couldn’t load a random image — try again");
    } finally {
      setPickingRandom(false);
    }
  }

  function removeCover() {
    onSetCoverColor(null);
    onSetCoverImage(null);
    setImageDraft("");
    setShowPicker(false);
  }

  return (
    <div
      ref={rootRef}
      className={`cover-banner group/cover ${className} ${dragging ? "cover-banner-drop" : ""}`}
      onDragEnter={(e) => {
        if (readOnly) return;
        if ([...e.dataTransfer.types].includes("Files")) setDragging(true);
      }}
      onDragOver={(e) => {
        if (readOnly) return;
        if ([...e.dataTransfer.types].includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (readOnly) return;
        if (!e.dataTransfer.files?.length) return;
        e.preventDefault();
        setDragging(false);
        void upload(e.dataTransfer.files[0] ?? null);
      }}
    >
      {coverImage ? (
        <div
          className="page-cover page-cover-image"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      ) : coverColor ? (
        <div className={`page-cover bg-gradient-to-r ${coverColor}`} />
      ) : compactEmpty ? (
        <div className="page-cover-placeholder" />
      ) : (
        <div className="page-cover page-cover-empty" />
      )}

      {!readOnly && (
        <div className={`page-header-actions ${hasCover || showPicker ? "page-header-actions-visible" : ""}`}>
          <button
            type="button"
            className="page-header-action"
            onClick={() => {
              if (!hasCover && !showPicker) {
                onSetCoverColor(COVER_GRADIENTS[1].id);
              }
              setShowPicker((v) => !v);
            }}
          >
            <ImageIcon className="size-3.5" />
            {hasCover ? "Change cover" : "Add cover"}
          </button>
          <button
            type="button"
            className="page-header-action"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            {uploading ? "Uploading…" : "Upload"}
          </button>
          {hasCover && (
            <button type="button" className="page-header-action" onClick={removeCover}>
              <X className="size-3.5" />
              Remove
            </button>
          )}
        </div>
      )}

      {dragging && !readOnly && (
        <div className="cover-drop-hint">Drop image to set cover</div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void upload(e.target.files?.[0] ?? null)}
      />

      {showPicker && !readOnly && (
        <div className="cover-picker-panel" role="dialog" aria-label="Cover options">
          <p className="cover-picker-label">Gallery</p>
          <div className="cover-gallery-grid">
            {COVER_GALLERY.map((cover) => (
              <button
                key={cover.id}
                type="button"
                className={`cover-gallery-item ${coverImage === cover.url ? "cover-gallery-item-active" : ""}`}
                title={cover.label}
                aria-label={cover.label}
                style={{ backgroundImage: `url(${cover.url})` }}
                onClick={() => {
                  setImageDraft(cover.url);
                  onSetCoverColor(null);
                  onSetCoverImage(cover.url);
                  onSuccess?.("Cover image saved");
                }}
              />
            ))}
          </div>

          <p className="cover-picker-label">Gradient</p>
          <div className="cover-picker-swatches">
            {COVER_GRADIENTS.filter((c) => c.id).map((cover) => (
              <button
                key={cover.id}
                type="button"
                aria-label={cover.label}
                title={cover.label}
                className={`cover-swatch bg-gradient-to-r ${cover.id} ${
                  !coverImage && coverColor === cover.id ? "cover-swatch-active" : ""
                }`}
                onClick={() => {
                  onSetCoverImage(null);
                  onSetCoverColor(cover.id);
                }}
              />
            ))}
          </div>

          <p className="cover-picker-label">
            <Upload className="inline size-3" /> Upload, random, or paste URL
          </p>
          <div className="cover-image-row">
            <button
              type="button"
              className="cover-image-upload"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              className="cover-image-upload"
              disabled={pickingRandom}
              title="Random image from Lorem Picsum"
              onClick={() => void pickRandomPicsum()}
            >
              {pickingRandom ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Dices className="size-3.5" />
              )}
              {pickingRandom ? "Picking…" : "Random"}
            </button>
            <input
              className="cover-image-input"
              placeholder="https://… image URL"
              value={imageDraft}
              onChange={(e) => {
                setImageDraft(e.target.value);
                setImageError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyImageUrl();
                }
              }}
            />
            <button type="button" className="cover-image-apply" onClick={applyImageUrl}>
              <Link2 className="size-3.5" />
              Apply
            </button>
          </div>
          {imageError && <p className="cover-image-error">{imageError}</p>}
          <p className="cover-picker-hint">
            Tip: drag & drop an image · click outside or Esc to close
          </p>
        </div>
      )}
    </div>
  );
}
