"use client";

import { useEffect, useRef } from "react";

type Stroke = { points: number[]; color: string; width: number };

function parseStrokes(raw: string | undefined): Stroke[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as Stroke[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function PublishedCanvas({ strokesJson }: { strokesJson?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const strokes = parseStrokes(strokesJson);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, w, h);

    for (const s of strokes) {
      const pts = s.points;
      if (!pts || pts.length < 4) continue;
      ctx.strokeStyle = s.color || "#1a1a1a";
      ctx.lineWidth = s.width || 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0]! * w, pts[1]! * h);
      for (let i = 2; i < pts.length; i += 2) {
        ctx.lineTo(pts[i]! * w, pts[i + 1]! * h);
      }
      ctx.stroke();
    }
  }, [strokesJson]);

  return (
    <canvas
      ref={canvasRef}
      className="published-canvas-surface"
      aria-label="Whiteboard sketch"
    />
  );
}
