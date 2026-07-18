"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type ReactNode } from "react";

type Props<T> = {
  items: T[];
  estimateSize?: number;
  overscan?: number;
  className?: string;
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
};

export function VirtualList<T>({
  items,
  estimateSize = 36,
  overscan = 8,
  className,
  getKey,
  renderItem,
}: Props<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: (index) => getKey(items[index]!, index),
  });

  return (
    <div ref={parentRef} className={className ?? "virtual-list"}>
      <div
        className="virtual-list-inner"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className="virtual-list-row"
            style={{
              transform: `translateY(${row.start}px)`,
            }}
          >
            {renderItem(items[row.index]!, row.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
