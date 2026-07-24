import { describe, expect, it } from "vitest";
import {
  formatMonthLabel,
  monthCursorFromKey,
  monthGridKeys,
  monthKeys,
  shiftMonth,
  toDailyKey,
} from "@/lib/daily";

describe("month calendar helpers", () => {
  it("builds all keys for a month", () => {
    const keys = monthKeys(2026, 6); // July 2026
    expect(keys).toHaveLength(31);
    expect(keys[0]).toBe("2026-07-01");
    expect(keys[30]).toBe("2026-07-31");
  });

  it("pads a Sun–Sat month grid", () => {
    // July 2026 starts on Wednesday
    const grid = monthGridKeys(2026, 6);
    expect(grid.length % 7).toBe(0);
    expect(grid[0].inMonth).toBe(false);
    const firstInMonth = grid.find((c) => c.inMonth);
    expect(firstInMonth?.key).toBe("2026-07-01");
    expect(firstInMonth?.day).toBe(1);
  });

  it("shifts months across year boundaries", () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2025, 11, 1)).toEqual({ year: 2026, month: 0 });
  });

  it("formats month labels and cursor from keys", () => {
    expect(monthCursorFromKey("2026-07-17")).toEqual({ year: 2026, month: 6 });
    expect(formatMonthLabel(2026, 6)).toMatch(/July/);
    expect(toDailyKey(new Date(2026, 6, 17))).toBe("2026-07-17");
  });
});
