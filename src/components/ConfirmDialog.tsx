"use client";

import { useEffect } from "react";

/** 受控确认弹窗:替代原生 window.confirm。Escape / 点遮罩取消,Enter 确认。 */
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        aria-label="取消"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise-in relative w-full max-w-sm rounded-xl border border-line bg-white p-6 shadow-xl shadow-ink/10"
      >
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {body && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="press rounded-full border border-line px-5 py-2 text-sm font-medium text-ink transition hover:border-accent/40"
          >
            取消
          </button>
          <button
            autoFocus
            onClick={onConfirm}
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
