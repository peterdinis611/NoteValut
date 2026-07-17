"use client";

import { COVER_GRADIENTS } from "@/lib/blocks";
import { ImageIcon, Smile, X } from "lucide-react";
import { useState } from "react";

type Props = {
  hasCover: boolean;
  hasIcon: boolean;
  coverValue?: string;
  onAddIcon: () => void;
  onAddCover: (cover: string) => void;
  onRemoveCover: () => void;
};

export function PageHeaderActions({
  hasCover,
  hasIcon,
  coverValue,
  onAddIcon,
  onAddCover,
  onRemoveCover,
}: Props) {
  const [showCovers, setShowCovers] = useState(false);

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
          {COVER_GRADIENTS.filter((c) => c.id).map((cover) => (
            <button
              key={cover.id}
              type="button"
              aria-label={cover.label}
              title={cover.label}
              className={`cover-swatch bg-gradient-to-r ${cover.id} ${
                coverValue === cover.id ? "cover-swatch-active" : ""
              }`}
              onClick={() => onAddCover(cover.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
