"use client";

import Cropper, { type Area } from "react-easy-crop";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { AnimePresence } from "@/lib/anime-ui";

type Props = {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropped: (blob: Blob) => void | Promise<void>;
};

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn’t load image"));
    img.src = src;
  });
}

export function ImageCropDialog({ open, imageSrc, onClose, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_area: Area, croppedAreaPixels: Area) => {
    setArea(croppedAreaPixels);
  }, []);

  const apply = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imageSrc, area);
      await onCropped(blob);
      onClose();
    } catch {
      /* parent toasts */
    } finally {
      setBusy(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="nv-crop-overlay">
        <button type="button" className="nv-crop-backdrop" aria-label="Close" onClick={onClose} />
        <div className="nv-crop-panel" role="dialog" aria-modal="true" aria-label="Crop image">
          <header className="nv-crop-head">
            <h2>Crop image</h2>
            <button type="button" className="graph-close" aria-label="Close" onClick={onClose}>
              <X className="size-4" />
            </button>
          </header>
          <div className="nv-crop-stage">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={undefined}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="nv-crop-controls">
            <label className="nv-crop-zoom">
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
            <div className="nv-crop-actions">
              <button type="button" className="vault-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="vault-btn-primary"
                disabled={busy || !area}
                onClick={() => void apply()}
              >
                <Check className="size-3.5" />
                {busy ? "Saving…" : "Apply crop"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
