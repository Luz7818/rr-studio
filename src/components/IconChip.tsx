import type { LucideIcon } from "lucide-react";

/** 面板标题图标芯片:卡片头部的统一装饰位(flolab「白胶囊承载彩色图形」的微缩版) */
const TONES = {
  accent: "bg-accent-soft text-accent",
  ink: "bg-band text-ink",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

export default function IconChip({
  icon: Icon,
  tone = "accent",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full ${TONES[tone]} ${
        size === "sm" ? "h-6 w-6" : "h-7 w-7"
      }`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={1.75} />
    </span>
  );
}
