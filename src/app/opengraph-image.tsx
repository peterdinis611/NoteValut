import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, #e8d5b8 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 100%, #c9b8a0 0%, transparent 50%), #f5efe6",
          color: "#2a2218",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.55,
          }}
        >
          Notes · Tags · Vault
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>
            {siteConfig.name}
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 820,
              fontSize: 34,
              lineHeight: 1.35,
              opacity: 0.78,
            }}
          >
            {siteConfig.tagline}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
