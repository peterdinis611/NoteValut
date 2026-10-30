import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — same vault mark, roomier for home screen. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, #ffe8c8 0%, #f5efe6 55%, #e8dcc8 100%)",
        }}
      >
        <div
          style={{
            width: 118,
            height: 134,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: "#2a2218",
            borderRadius: 28,
            boxShadow: "0 10px 0 #c9b8a0, 0 18px 36px rgba(42,34,24,0.28)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 22,
              bottom: 22,
              width: 14,
              background: "linear-gradient(180deg, #d4b483 0%, #a8895a 100%)",
              borderTopRightRadius: 6,
              borderBottomRightRadius: 6,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 38,
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "#f5efe6",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 54,
              width: 10,
              height: 22,
              background: "#f5efe6",
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
              display: "flex",
            }}
          />
          <div
            style={{
              marginTop: 40,
              display: "flex",
              color: "#f5efe6",
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            N
          </div>
        </div>
      </div>
    ),
    size,
  );
}
