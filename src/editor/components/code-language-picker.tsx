"use client";

import { Check, ChevronsUpDown, Search, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  CODE_LANGUAGES,
  POPULAR_PICKER_IDS,
  type LanguageOption,
} from "@/lib/highlight";
import { dropdownVariants, easeOutSoft } from "@/lib/motion";

type Props = {
  value: string;
  disabled?: boolean;
  detected?: string;
  onChange: (language: string) => void;
  onFocus?: () => void;
};

type MenuPos = { top: number; left: number; width: number };

export function CodeLanguagePicker({
  value,
  disabled,
  detected,
  onChange,
  onFocus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState<(MenuPos & { openUp: boolean }) | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const current =
    CODE_LANGUAGES.find((l) => l.id === value) ??
    ({ id: value, label: value } satisfies LanguageOption);

  const popular = useMemo(
    () =>
      POPULAR_PICKER_IDS.map((id) => CODE_LANGUAGES.find((l) => l.id === id)).filter(
        (l): l is LanguageOption => !!l,
      ),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CODE_LANGUAGES;
    return CODE_LANGUAGES.filter(
      (l) => l.id.toLowerCase().includes(q) || l.label.toLowerCase().includes(q),
    );
  }, [query]);

  const rest = useMemo(() => {
    const popularSet = new Set<string>(POPULAR_PICKER_IDS);
    return filtered.filter((l) => !popularSet.has(l.id));
  }, [filtered]);

  const flatList = useMemo(() => {
    if (query.trim()) return filtered;
    return [...popular, ...rest];
  }, [filtered, popular, query, rest]);

  useEffect(() => setMounted(true), []);

  function updatePos() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(288, Math.max(220, window.innerWidth - 24));
    let left = r.left;
    if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
    if (left < 12) left = 12;
    const spaceBelow = window.innerHeight - r.bottom;
    const menuH = Math.min(360, window.innerHeight * 0.55);
    const openUp = spaceBelow < menuH + 12 && r.top > spaceBelow;
    setPos({
      top: openUp ? r.top - 8 : r.bottom + 6,
      left,
      width,
      openUp,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    setQuery("");
    setActiveIndex(Math.max(0, flatList.findIndex((l) => l.id === value)));
    requestAnimationFrame(() => searchRef.current?.focus());
    function onScroll() {
      updatePos();
    }
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-lang-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, query]);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onSearchKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, flatList.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatList[activeIndex];
      if (item) select(item.id);
    }
  }

  const displayLabel =
    value === "auto" && detected ? `Auto · ${detected}` : current.label;

  const menu =
    open && pos ? (
      <motion.div
        key="code-lang-menu"
        ref={menuRef}
        className="nv-code-lang-menu"
        role="listbox"
        aria-label="Code language"
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={easeOutSoft}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: pos.width,
          transform: pos.openUp ? "translateY(-100%)" : undefined,
          transformOrigin: pos.openUp ? "bottom left" : "top left",
        }}
      >
        <div className="nv-code-lang-search">
          <Search className="size-3.5 shrink-0 opacity-45" />
          <input
            ref={searchRef}
            className="nv-code-lang-search-input"
            placeholder="Search languages…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onSearchKeyDown}
          />
          {query && (
            <kbd className="nv-code-lang-kbd">esc</kbd>
          )}
        </div>

        <div className="nv-code-lang-list note-scroll" ref={listRef}>
          {flatList.length === 0 ? (
            <p className="nv-code-lang-empty">No matches for “{query.trim()}”</p>
          ) : query.trim() ? (
            <LangGroup
              items={flatList}
              value={value}
              activeIndex={activeIndex}
              indexOffset={0}
              onHover={setActiveIndex}
              onSelect={select}
            />
          ) : (
            <>
              <p className="nv-code-lang-section">Popular</p>
              <div className="nv-code-lang-chips">
                {popular.map((lang, i) => {
                  const selected = lang.id === value;
                  const active = i === activeIndex;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-lang-index={i}
                      className={`nv-code-lang-chip ${active ? "nv-code-lang-chip-active" : ""} ${selected ? "nv-code-lang-chip-selected" : ""}`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => select(lang.id)}
                    >
                      {lang.id === "auto" ? (
                        <Sparkles className="size-3 opacity-70" />
                      ) : null}
                      {lang.label}
                    </button>
                  );
                })}
              </div>
              <p className="nv-code-lang-section">All languages</p>
              <LangGroup
                items={rest}
                value={value}
                activeIndex={activeIndex}
                indexOffset={popular.length}
                onHover={setActiveIndex}
                onSelect={select}
              />
            </>
          )}
        </div>
      </motion.div>
    ) : null;

  return (
    <div className="nv-code-lang-picker" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`nv-code-lang-trigger ${open ? "nv-code-lang-trigger-open" : ""} ${value === "auto" ? "nv-code-lang-trigger-auto" : ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          onFocus?.();
          setOpen((v) => !v);
        }}
      >
        {value === "auto" && <Sparkles className="size-3 opacity-70" />}
        <span className="nv-code-lang-trigger-label">{displayLabel}</span>
        <ChevronsUpDown className="size-3 opacity-50" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>{menu}</AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

function LangGroup({
  items,
  value,
  activeIndex,
  indexOffset,
  onHover,
  onSelect,
}: {
  items: LanguageOption[];
  value: string;
  activeIndex: number;
  indexOffset: number;
  onHover: (index: number) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="nv-code-lang-group">
      {items.map((lang, i) => {
        const index = indexOffset + i;
        const active = index === activeIndex;
        const selected = lang.id === value;
        return (
          <li key={lang.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              data-lang-index={index}
              className={`nv-code-lang-option ${active ? "nv-code-lang-option-active" : ""} ${selected ? "nv-code-lang-option-selected" : ""}`}
              onMouseEnter={() => onHover(index)}
              onClick={() => onSelect(lang.id)}
            >
              <span className="nv-code-lang-option-label">{lang.label}</span>
              <span className="nv-code-lang-option-id">{lang.id}</span>
              {selected && <Check className="size-3.5 shrink-0 text-accent" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
