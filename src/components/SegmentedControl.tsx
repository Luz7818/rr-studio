"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 分段控件:bg-band 胶囊槽 + 白色活动块在选项间滑动(DESIGN.md 的分段控件语言,
 * 活动块从瞬时切换升级为滑动过渡)。只动 transform/width;reduced-motion 由
 * globals 全局降级为直跳。测量基于 getBoundingClientRect 差值,滚动安全。
 */
export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "sm",
  className = "",
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: React.ReactNode; title?: string }>;
  /** sm = 页签/筛选(px-3.5 py-1.5);md = 工作台主导航(px-4 py-2) */
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<T, HTMLButtonElement>());
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  /** 首帧定位不做过渡,避免活动块从 0 滑入 */
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const el = itemsRef.current.get(value);
    const container = containerRef.current;
    if (!el || !container) return;
    const er = el.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    setThumb({ left: er.left - cr.left, width: er.width });
  }, [value]);

  useEffect(() => {
    measure();
    const raf = requestAnimationFrame(() => setAnimate(true));
    window.addEventListener("resize", measure);
    // 字体加载完成会改变文本宽度,补测一次
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const pad = size === "md" ? "px-4 py-2" : "px-3.5 py-1.5";

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative inline-flex shrink-0 rounded-full bg-band p-1 text-[13px] ${className}`}
    >
      {thumb && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 rounded-full bg-white shadow-sm"
          style={{
            width: thumb.width,
            transform: `translateX(${thumb.left}px)`,
            transition: animate
              ? "transform 0.24s cubic-bezier(0.3, 1.3, 0.35, 1), width 0.24s cubic-bezier(0.23, 1, 0.32, 1)"
              : undefined,
          }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          ref={(el) => {
            if (el) itemsRef.current.set(o.value, el);
            else itemsRef.current.delete(o.value);
          }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`relative z-10 whitespace-nowrap rounded-full transition-colors duration-150 ${pad} ${
            o.value === value ? "font-medium text-ink" : "text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
