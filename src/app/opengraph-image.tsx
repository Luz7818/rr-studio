import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "R&R Studio — AI review pipeline for graduate submissions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG 卡:真实产品截图为底 + 深色渐变压暗 + 拉丁字符叠加。
 *  中文不进 satori(satori 无内置 CJK 字体会渲染为空),中文语义由截图像素承载。 */
export default async function OpengraphImage() {
  const png = await readFile(path.join(process.cwd(), "public", "showcase-response.png"));
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#17171c",
          position: "relative",
        }}
      >
        {/* 截图底图(上 62%) */}
        <div style={{ display: "flex", height: "62%", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="" width={1200} height={390} style={{ objectFit: "cover", objectPosition: "top" }} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(180deg, rgba(23,23,28,0.06) 0%, rgba(23,23,28,0) 45%, rgba(23,23,28,0.45) 78%, rgba(23,23,28,1) 100%)",
              display: "flex",
            }}
          />
        </div>
        {/* 文案区 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: 56,
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                background: "#5147E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              R
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#fff" }}>R&amp;R Studio</div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {["Revise & Resubmit", "40+ notes / paper", "3 AI reviewers"].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "8px 22px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 19,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
