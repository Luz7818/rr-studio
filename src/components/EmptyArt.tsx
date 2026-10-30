/** 空态插画:品牌母题「稿件 × 判定勾」的静音版,仅用令牌色(工作台与仪表盘共用) */
export default function EmptyArt() {
  return (
    <svg width="112" height="84" viewBox="0 0 112 84" fill="none" aria-hidden className="float-soft-xs mx-auto mb-4">
      <rect x="42" y="6" width="40" height="52" rx="5" fill="#eeeefc" transform="rotate(6 62 32)" />
      <g transform="rotate(-5 44 42)">
        <rect x="24" y="16" width="42" height="54" rx="5" fill="#fff" stroke="#ececf0" strokeWidth="1.5" />
        <g stroke="#d9d5f8" strokeWidth="3.2" strokeLinecap="round">
          <path d="M31 27 H50" />
          <path d="M31 35 H59" />
          <path d="M31 43 H46" />
        </g>
        <path d="M33 53 L41 61 L57 42" stroke="#5147E5" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx="18" cy="20" r="3" fill="#eeeefc" />
      <circle cx="96" cy="62" r="4" fill="#eeeefc" />
      <path d="M92 16 L96 10 M98 18 L104 14" stroke="#d9d5f8" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
