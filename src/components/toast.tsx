"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { playAnime } from "@/lib/anime-ui";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  kind: ToastKind;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

function ToastCard({ toast, onGone }: { toast: ToastItem; onGone: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const Icon = ICONS[toast.kind];

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) void playAnime(el, "toast", "enter");
  }, []);

  function close() {
    if (closingRef.current) return;
    closingRef.current = true;
    const el = ref.current;
    void (el ? playAnime(el, "toast", "exit") : Promise.resolve()).then(() => onGone(toast.id));
  }

  useEffect(() => {
    const t = window.setTimeout(close, 3200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div ref={ref} className={`toast toast-${toast.kind}`} role="status">
      <Icon className="toast-icon size-4" />
      <span className="toast-message">{toast.message}</span>
      <button type="button" className="toast-close" aria-label="Dismiss" onClick={close}>
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, kind: ToastKind) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-3), { id, message, kind }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
      info: (message) => push(message, "info"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onGone={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
