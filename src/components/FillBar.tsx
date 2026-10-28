"use client";

import { useEffect, useState } from "react";

/**
 * 数据条:挂载后从 0 填充到目标宽度(0.6s,全局统一缓动),
 * 之后的宽度变化(如进度更新)沿用同一过渡。reduced-motion 由 globals 降级为直显。
 */
export default function FillBar({
  pct,
  className = "",
  innerClassName = "bg-accent",
  ariaHidden = true,
}: {
  /** 0–100 */
  pct: number;
  /** 轨道尺寸/宽度类,如 h-1 w-20 */
  className?: string;
  innerClassName?: string;
  ariaHidden?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className={`overflow-hidden rounded-full bg-band ${className}`}
    >
      <div
        className={`bar-fill h-full rounded-full ${innerClassName}`}
        style={{ width: `${shown}%` }}
      />
    </div>
  );
}
