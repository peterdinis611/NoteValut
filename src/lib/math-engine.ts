import { all, create, type MathJsInstance } from "mathjs";

/**
 * Shared math.js instance for advanced numeric / symbolic ops in the vault.
 * Use this from editor blocks, ⌘K calcs, or future formula fields.
 */
let instance: MathJsInstance | null = null;

export function getMath(): MathJsInstance {
  if (!instance) {
    instance = create(all, {
      number: "BigNumber",
      precision: 64,
    });
  }
  return instance;
}

export type MathEvalOk = { ok: true; value: unknown; display: string };
export type MathEvalErr = { ok: false; error: string };
export type MathEvalResult = MathEvalOk | MathEvalErr;

/** Evaluate a math.js expression; returns a display-ready string on success. */
export function evaluateMath(expression: string): MathEvalResult {
  const expr = expression.trim();
  if (!expr) return { ok: false, error: "Empty expression" };

  try {
    const math = getMath();
    const value = math.evaluate(expr);
    return { ok: true, value, display: formatMathValue(value) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid expression";
    return { ok: false, error: message };
  }
}

/** Format math.js values (BigNumber, Matrix, Unit, …) for UI. */
export function formatMathValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const math = getMath();

  if (typeof value === "function") return "[function]";

  try {
    if (math.isBigNumber(value) || math.isComplex(value) || math.isUnit(value)) {
      return value.toString();
    }
    if (math.isMatrix(value) || math.isFraction(value)) {
      return math.format(value, { precision: 14 });
    }
    if (typeof value === "object") {
      return math.format(value as never, { precision: 14 });
    }
    return String(value);
  } catch {
    return String(value);
  }
}

/** Strip a leading `=` used in “calc” lines. */
export function normalizeComputeExpr(text: string): string {
  return text.replace(/^\s*=\s*/, "").trim();
}
