"use client";

import { Eraser, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Extension } from "../create-extension";
import type { BlockRenderProps } from "../types";

type Stroke = {
  points: number[]; // [x,y,x,y,...] normalized 0–1
  color: string;
  width: number;
};

function parseStrokes(raw: string): Stroke[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as Stroke[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function CanvasBoard(props: BlockRenderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const drawing = useRef(false);
  const current = useRef<Stroke | null>(null);
  const strokes = useRef<Stroke[]>(parseStrokes(props.block.text));
  const color = "#e8611a";

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "color-mix(in srgb, var(--panel) 80%, #000)";
    // fallback fill
    ctx.fillStyle = "rgba(10, 18, 16, 0.55)";
    ctx.fillRect(0, 0, w, h);

    for (const s of strokes.current) {
      if (s.points.length < 4) continue;
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.moveTo(s.points[0]! * w, s.points[1]! * h);
      for (let i = 2; i < s.points.length; i += 2) {
        ctx.lineTo(s.points[i]! * w, s.points[i + 1]! * h);
      }
      ctx.stroke();
    }
  }

  useEffect(() => {
    strokes.current = parseStrokes(props.block.text);
    redraw();
  }, [props.block.text]);

  useEffect(() => {
    redraw();
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  function commit() {
    if (props.readOnly) return;
    props.commands.updateBlock(props.block.id, {
      text: JSON.stringify(strokes.current),
    });
  }

  return (
    <div className="nv-canvas" onFocus={props.onFocus}>
      {!props.readOnly && (
        <div className="nv-canvas-toolbar">
          <button
            type="button"
            className={`nv-canvas-tool ${tool === "pen" ? "is-on" : ""}`}
            onClick={() => setTool("pen")}
            aria-label="Pen"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            className={`nv-canvas-tool ${tool === "eraser" ? "is-on" : ""}`}
            onClick={() => setTool("eraser")}
            aria-label="Eraser"
          >
            <Eraser className="size-3.5" />
          </button>
          <button
            type="button"
            className="nv-canvas-tool"
            onClick={() => {
              strokes.current = [];
              redraw();
              commit();
            }}
            aria-label="Clear"
          >
            <Trash2 className="size-3.5" />
          </button>
          <span className="nv-canvas-label">Whiteboard</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="nv-canvas-surface"
        onPointerDown={(e) => {
          if (props.readOnly) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const p = pos(e);
          current.current = {
            points: [p.x, p.y],
            color: tool === "eraser" ? "rgba(10,18,16,1)" : color,
            width: tool === "eraser" ? 18 : 2.5,
          };
          strokes.current = [...strokes.current, current.current];
        }}
        onPointerMove={(e) => {
          if (!drawing.current || !current.current) return;
          const p = pos(e);
          current.current.points.push(p.x, p.y);
          const head = strokes.current.slice(0, -1);
          strokes.current = [...head, current.current];
          redraw();
        }}
        onPointerUp={() => {
          if (!drawing.current) return;
          drawing.current = false;
          if (current.current && current.current.points.length >= 4) {
            commit();
          } else {
            strokes.current = parseStrokes(props.block.text);
            redraw();
          }
          current.current = null;
        }}
      />
    </div>
  );
}

export const CanvasBlock = Extension({
  name: "canvas",
  types: ["canvas"],
  atom: true,
  slashCommands: [
    {
      id: "canvas",
      type: "canvas",
      label: "Whiteboard",
      description: "Quick sketch canvas",
      icon: "✎",
      keywords: ["canvas", "draw", "sketch", "whiteboard", "pen"],
      group: "Media",
    },
  ],
  render: (props) => <CanvasBoard {...props} />,
});
