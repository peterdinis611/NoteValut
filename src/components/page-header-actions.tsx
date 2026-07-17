"use client";

import { COVER_GRADIENTS } from "@/lib/blocks";
import { firstIssue, parseCoverImage } from "@/lib/validation";
import { ImageIcon, Link2, Smile, X } from "lucide-react";
import { useState } from "react";

type Props = {
  hasCover: boolean;
  hasIcon: boolean;
  coverValue?: string;
  coverImage?: string;
  onAddIcon: () => void;
  onAddCover: (cover: string) => void;
  onSetCoverImage: (url: string | null) => void;
  onRemoveCover: () => void;
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
}: Props) {
  const [showCovers, setShowCovers] = useState(false);
  const [imageDraft, setImageDraft] = useState(coverImage ?? "");
  const [imageError, setImageError] = useState<string | null>(null);

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
            <Link2 className="inline size-3" /> Background image
          </p>
          <div className="cover-image-row">
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
              Apply
            </button>
          </div>
          {imageError && <p className="cover-image-error">{imageError}</p>}
        </div>
      )}
    </div>
  );
}
