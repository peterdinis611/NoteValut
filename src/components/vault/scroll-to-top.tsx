"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

function getScrollTop(target: HTMLElement | Window) {
  if (target === window) {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }
  return (target as HTMLElement).scrollTop;
}

function scrollTargetToTop(
  target: HTMLElement | Window,
  behavior: ScrollBehavior,
) {
  if (target === window) {
    window.scrollTo({ top: 0, behavior });
    return;
  }
  (target as HTMLElement).scrollTo({ top: 0, behavior });
}

export function ScrollToTopButton({
  target,
  threshold = 240,
  className,
  fixed = false,
}: {
  target: HTMLElement | Window | null;
  threshold?: number;
  className?: string;
  /** Use viewport-fixed placement (vault-global). */
  fixed?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!target) {
      setVisible(false);
      return;
    }

    const onScroll = () => {
      setVisible(getScrollTop(target) > threshold);
    };

    onScroll();
    if (target === window) {
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [target, threshold]);

  const scrollTop = () => {
    if (!target) return;
    scrollTargetToTop(target, reduceMotion ? "auto" : "smooth");
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.94 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            fixed
              ? "pointer-events-none fixed right-5 bottom-5 z-40 md:right-7 md:bottom-7"
              : "pointer-events-none absolute right-5 bottom-5 z-20",
            className,
          )}
        >
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Scroll to top"
            onClick={scrollTop}
            className="pointer-events-auto size-10 rounded-full border-border bg-card/95 text-foreground shadow-md backdrop-blur-sm hover:bg-muted"
          >
            <ArrowUp className="size-4" />
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Scrollable pane marked for {@link VaultGlobalScrollToTop}.
 * Keeps an optional local button when `localButton` is true (default off —
 * vault shell owns the fixed control).
 */
export function ScrollPane({
  children,
  className,
  threshold,
  localButton = false,
}: {
  children: ReactNode;
  className?: string;
  threshold?: number;
  localButton?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(ref.current);
  }, []);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={ref}
        data-vault-scroll=""
        className={cn("min-h-0 flex-1 overflow-y-auto", className)}
      >
        {children}
      </div>
      {localButton ? (
        <ScrollToTopButton target={target} threshold={threshold} />
      ) : null}
    </div>
  );
}

/**
 * Vault-wide scroll-to-top: follows whichever `[data-vault-scroll]` pane
 * (or the window) last scrolled past the threshold.
 */
export function VaultGlobalScrollToTop({ threshold = 240 }: { threshold?: number }) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const targetRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    const resolvePane = (): HTMLElement | Window => {
      const panes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-vault-scroll]"),
      );
      const active = panes.find((pane) => {
        const style = window.getComputedStyle(pane);
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }
        const rect = pane.getBoundingClientRect();
        return rect.width > 0 && rect.height > 40;
      });
      if (active && active.scrollHeight > active.clientHeight + 2) return active;
      return window;
    };

    const syncFrom = (source: HTMLElement | Window) => {
      targetRef.current = source;
      setVisible(getScrollTop(source) > threshold);
    };

    const onScroll = (event: Event) => {
      const node = event.target;
      if (node instanceof HTMLElement && node.hasAttribute("data-vault-scroll")) {
        syncFrom(node);
        return;
      }
      if (node === document || node === document.documentElement || node === document.body) {
        syncFrom(window);
      }
    };

    syncFrom(resolvePane());
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", () => syncFrom(resolvePane()));
    return () => {
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [threshold]);

  const scrollTop = () => {
    const target = targetRef.current ?? window;
    scrollTargetToTop(target, reduceMotion ? "auto" : "smooth");
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.94 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed right-5 bottom-5 z-40 md:right-7 md:bottom-7"
        >
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Scroll to top"
            onClick={scrollTop}
            className="pointer-events-auto size-10 rounded-full border-border bg-card/95 text-foreground shadow-md backdrop-blur-sm hover:bg-muted"
          >
            <ArrowUp className="size-4" />
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
