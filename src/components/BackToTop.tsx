"use client";

import { ArrowUp } from "lucide-react";

/** 页脚「回到顶部」:平滑滚动,箭头悬停上浮 */
export default function BackToTop() {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="group inline-flex items-center gap-1 text-ink-faint transition hover:text-accent"
    >
      回到顶部
      <ArrowUp
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5"
        strokeWidth={1.75}
        aria-hidden
      />
    </a>
  );
}
