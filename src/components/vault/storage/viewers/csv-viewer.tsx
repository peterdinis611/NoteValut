"use client";

import { useMemo } from "react";
import { ViewerError, ViewerFrame, ViewerLoading } from "./viewer-shell";
import { useVaultFileText } from "./use-vault-file";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char === "\r") {
      // ignore CR; handle CRLF via next \n
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((item) => item.some((value) => value.trim().length > 0));
}

export function CsvViewer({ fileId }: { fileId: string }) {
  const state = useVaultFileText(fileId);
  const rows = useMemo(
    () => (state.status === "ready" ? parseCsv(state.data) : []),
    [state],
  );

  if (state.status === "loading") return <ViewerLoading label="Loading CSV…" />;
  if (state.status === "error") return <ViewerError message={state.message} />;
  if (rows.length === 0) {
    return <ViewerError message="CSV looks empty." />;
  }

  const header = rows[0]!;
  const body = rows.slice(1, 201);

  return (
    <ViewerFrame className="p-0">
      <div className="overflow-auto">
        <table className="min-w-full border-collapse text-left text-[12.5px]">
          <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
            <tr>
              {header.map((cell, index) => (
                <th
                  key={`h-${index}`}
                  className="border-b border-border px-3 py-2 font-mono text-[10px] font-medium tracking-wide text-foreground/70 uppercase"
                >
                  {cell || `col_${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr
                key={`r-${rowIndex}`}
                className="odd:bg-background even:bg-muted/25"
              >
                {header.map((_, colIndex) => (
                  <td
                    key={`c-${rowIndex}-${colIndex}`}
                    className="max-w-[240px] truncate border-b border-border/60 px-3 py-1.5 text-foreground/85"
                    title={row[colIndex] ?? ""}
                  >
                    {row[colIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 201 ? (
        <p className="border-t border-border px-3 py-2 font-mono text-[10px] text-foreground/50">
          Showing first 200 data rows of {rows.length - 1}
        </p>
      ) : null}
    </ViewerFrame>
  );
}
