/** 页面级装饰背景:顶部构图(柔色块 + 同心环 + 十字/圆点母题 + 弧线,660px 渐隐)
 *  + 全页恒存的十字纹理层。全部由 DecoCluster 同族令牌色基元构成,aria-hidden。 */
export default function PageDeco() {
  return (
    <>
      {/* 全页十字纹理:滚动全程都有可感知的底纹 */}
      <div aria-hidden className="page-texture" />
      {/* 顶部构图 */}
      <div aria-hidden className="page-deco">
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 720"
          preserveAspectRatio="xMidYMin slice"
          fill="none"
        >
          <defs>
            <radialGradient id="pd-blob-a" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#6d5ef0" stopOpacity="0.22" />
              <stop offset="1" stopColor="#6d5ef0" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="pd-blob-b" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#5147e5" stopOpacity="0.18" />
              <stop offset="1" stopColor="#5147e5" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="pd-blob-c" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#818cf8" stopOpacity="0.2" />
              <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* 柔色块 */}
          <ellipse cx="210" cy="60" rx="430" ry="280" fill="url(#pd-blob-a)" />
          <ellipse cx="1230" cy="90" rx="480" ry="300" fill="url(#pd-blob-b)" />
          <ellipse cx="720" cy="-120" rx="520" ry="300" fill="url(#pd-blob-c)" />
          {/* 同心圆环组(左右各一组,虚环 + 实环) */}
          <circle cx="170" cy="230" r="96" stroke="#5147e5" strokeOpacity="0.14" strokeWidth="1.5" />
          <circle cx="170" cy="230" r="60" stroke="#5147e5" strokeOpacity="0.1" strokeWidth="1.5" strokeDasharray="3 6" />
          <circle cx="1310" cy="150" r="130" stroke="#5147e5" strokeOpacity="0.12" strokeWidth="1.5" />
          <circle cx="1310" cy="150" r="84" stroke="#5147e5" strokeOpacity="0.08" strokeWidth="1.5" strokeDasharray="3 6" />
          {/* 弧线:从两翼扫入 */}
          <path d="M-80 470 C 160 420, 260 300, 300 140" stroke="#e3e1f5" strokeWidth="1.5" />
          <path d="M1520 420 C 1300 380, 1200 280, 1160 120" stroke="#e3e1f5" strokeWidth="1.5" />
          {/* 手置十字(大号,呼应 DecoCluster) */}
          <path d="M96 84v16M88 92h16" stroke="#7c6cf0" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
          <path d="M1382 300v14M1375 307h14" stroke="#7c6cf0" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
          <path d="M520 60v12M514 66h12" stroke="#5147e5" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
          {/* 圆点散布 */}
          <circle cx="300" cy="120" r="4" fill="#7c6cf0" fillOpacity="0.35" />
          <circle cx="1120" cy="70" r="3" fill="#5147e5" fillOpacity="0.3" />
          <circle cx="640" cy="180" r="2.5" fill="#5147e5" fillOpacity="0.25" />
          <circle cx="88" cy="330" r="3" fill="#d9d5f8" />
          <circle cx="1396" cy="220" r="4" fill="#d9d5f8" />
          <circle cx="980" cy="40" r="2.5" fill="#7c6cf0" fillOpacity="0.3" />
        </svg>
      </div>
    </>
  );
}
