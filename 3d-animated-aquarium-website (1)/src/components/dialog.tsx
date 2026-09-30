"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

let dialogSequence = 0;

export default function Dialog({ children, onClose, title, className = "", drawer = false }: { children: ReactNode; onClose: () => void; title: string; className?: string; drawer?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sequence = ++dialogSequence;
    if (ref.current) {
      ref.current.dataset.dialogOrder = String(sequence);
      ref.current.parentElement!.style.zIndex = String(100 + sequence);
    }
    const isTopmost = () => {
      const dialogs = [...document.querySelectorAll<HTMLElement>("[data-dialog-order]")];
      return !dialogs.some(element => Number(element.dataset.dialogOrder) > sequence);
    };
    const focusTimer = window.setTimeout(() => { if (isTopmost()) ref.current?.querySelector<HTMLElement>("button, input, select, textarea, a[href]")?.focus(); }, 40);
    const keydown = (event: KeyboardEvent) => {
      if (!isTopmost()) return;
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key === "Tab") {
        const elements = ref.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex='0']");
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(<div className={`dialog-backdrop ${drawer ? "drawer-backdrop" : ""}`} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} className={`dialog ${drawer ? "drawer" : ""} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
      <button className="dialog-close icon-button" onClick={onClose} aria-label="Close dialog"><X size={21} /></button>
      {children}
    </div>
  </div>, document.body);
}
