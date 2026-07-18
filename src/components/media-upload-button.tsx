"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useVaultUpload } from "@/hooks/use-vault-upload";

type Props = {
  accept: string;
  label?: string;
  disabled?: boolean;
  onUploaded: (url: string, file: File) => void;
  onError?: (message: string) => void;
};

export function MediaUploadButton({
  accept,
  label = "Upload",
  disabled,
  onUploaded,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useVaultUpload();
  const [busy, setBusy] = useState(false);

  async function onPick(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      const uploaded = await uploadFile(file);
      onUploaded(uploaded.url, file);
    } catch {
      onError?.("Couldn’t upload file");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        className="nv-media-upload-btn"
        disabled={disabled || busy}
        title={label}
        aria-label={label}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
        <span>{busy ? "Uploading…" : label}</span>
      </button>
    </>
  );
}
