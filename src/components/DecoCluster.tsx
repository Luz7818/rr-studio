/** flolab 式几何装饰角件:圆环 + 十字 + 实心点,仅令牌色低饱和,
 *  供登录/注册卡、定价头部等静态位置的角落点缀。父容器需 relative + overflow-hidden。 */
export default function DecoCluster({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      className={`pointer-events-none absolute ${className}`}
    >
      <circle cx="50" cy="22" r="20" stroke="#ececf0" strokeWidth="1.5" />
      <circle cx="50" cy="22" r="12" stroke="#eeeefc" strokeWidth="1.5" />
      <path
        d="M14 44v12M8 50h12"
        stroke="#d9d5f8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="36" cy="60" r="3.5" fill="#eeeefc" />
      <circle cx="62" cy="52" r="2.5" fill="#d9d5f8" />
    </svg>
  );
}
