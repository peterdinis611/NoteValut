"use client";

import { COVER_GALLERY, COVER_GRADIENTS } from "@/lib/blocks";
import { firstIssue, parseCoverImage } from "@/lib/validation";
import { useVaultUpload } from "@/hooks/use-vault-upload";
import { ImageIcon, Link2, Loader2, Smile, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  hasCover: boolean;
  hasIcon: boolean;
  coverValue?: string;
  coverImage?: string;
  onAddIcon: () => void;
  onAddCover: (cover: string) => void;
  onSetCoverImage: (url: string | null) => void;
  onRemoveCover: () => void;
  onUploadError?: (message: string) => void;
};

export function PageHeaderActions({
  hasCover,
  hasIcon,
  coverValue,
  coverImage,
  onAddIcon,
  onAddCover,
  onSetCoverImage,
  onRemoveCover,
  onUploadError,
}: Props) {
  const [showCovers, setShowCovers] = useState(false);
  const [imageDraft, setImageDraft] = useState(coverImage ?? "");
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useVaultUpload();

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
    onSetCoverImage(parsed.output);
  }

  async function onPickFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onUploadError?.("Choose an image file");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setImageDraft(uploaded.url);
      setImageError(null);
      onSetCoverImage(uploaded.url);
    } catch {
      onUploadError?.("Couldn’t upload cover image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="page-header-actions">
      {!hasIcon && (
        <button type="button" className="page-header-action" onClick={onAddIcon}>
          <Smile className="size-3.5" />
          Add icon
        </button>
      )}
      <button
        type="button"
        className="page-header-action"
        onClick={() => {
          if (hasCover) setShowCovers((v) => !v);
          else {
            onAddCover(COVER_GRADIENTS[1].id);
            setShowCovers(true);
          }
        }}
      >
        <ImageIcon className="size-3.5" />
        {hasCover ? "Change cover" : "Add cover"}
      </button>
      {hasCover && (
        <button type="button" className="page-header-action" onClick={onRemoveCover}>
          <X className="size-3.5" />
          Remove cover
        </button>
      )}

      {showCovers && (
        <div className="cover-picker-panel">
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
                  onSetCoverImage(cover.url);
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
                  !coverImage && coverValue === cover.id ? "cover-swatch-active" : ""
                }`}
                onClick={() => {
                  onSetCoverImage(null);
                  onAddCover(cover.id);
                }}
              />
            ))}
          </div>

          <p className="cover-picker-label">
            <Upload className="inline size-3" /> Upload or paste URL
          </p>
          <div className="cover-image-row">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
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
        </div>
      )}
    </div>
  );
}
