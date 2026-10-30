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

export function ScrollToTopButton({
  target,
  threshold = 280,
  className,
}: {
  target: HTMLElement | null;
  threshold?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!target) {
      setVisible(false);
      return;
    }

    const onScroll = () => {
      setVisible(target.scrollTop > threshold);
    };

    onScroll();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [target, threshold]);

  const scrollTop = () => {
    if (!target) return;
    target.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
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
            "pointer-events-none absolute right-5 bottom-5 z-20",
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

/** Scrollable pane with a floating scroll-to-top control. */
export function ScrollPane({
  children,
  className,
  threshold,
}: {
  children: ReactNode;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setTarget(ref.current);
  }, []);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={ref}
        className={cn("min-h-0 flex-1 overflow-y-auto", className)}
      >
        {children}
      </div>
      <ScrollToTopButton target={target} threshold={threshold} />
    </div>
  );
}
