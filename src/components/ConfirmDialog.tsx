"use client";

import { useEffect, useId, useRef, useState } from "react";

const EXIT_MS = 130;

/**
 * 受控确认弹窗:替代原生 window.confirm。Escape / 点遮罩取消,Enter 确认
 * (确认按钮持有焦点)。入场 pop-in、退场淡出;Tab 在弹窗内循环;
 * 开启期间锁定背景滚动。reduced-motion 时跳过退场等待直接关。
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "确认",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

  // 重开时清除上一次的退场态(渲染期调整状态,避免 effect 里 setState)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setClosing(false);
  }

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose(onCancel);
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onCancel, closing]);

  if (!open) return null;

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function requestClose(action: () => void) {
    if (closing) return;
    if (reducedMotion) {
      action();
      return;
    }
    setClosing(true);
    setTimeout(action, EXIT_MS);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        aria-label="取消"
        onClick={() => requestClose(onCancel)}
        className={`absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px] transition-opacity duration-150 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-sm rounded-xl border border-line bg-white p-6 shadow-xl shadow-ink/10 transition-[opacity,transform] duration-150 ${
          closing ? "scale-[0.98] opacity-0" : "pop-in"
        }`}
      >
        <h3 id={titleId} className="text-base font-semibold tracking-tight">
          {title}
        </h3>
        {body && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => requestClose(onCancel)}
            className="press rounded-full border border-line px-5 py-2 text-sm font-medium text-ink transition hover:border-accent/40"
          >
            取消
          </button>
          <button
            autoFocus
            onClick={() => requestClose(onConfirm)}
            className={`press rounded-full px-5 py-2 text-sm font-medium text-white transition ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-accent hover:bg-accent/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
