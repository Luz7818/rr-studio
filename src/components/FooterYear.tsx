"use client";

/** cacheComponents 下服务端不能读当前时间,年份在客户端渲染 */
export default function FooterYear() {
  return <>{new Date().getFullYear()}</>;
}
