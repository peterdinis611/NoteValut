import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon: cream tile + vault door monogram (reads at 16–32px). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5efe6",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 42,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: "#2a2218",
            borderRadius: 10,
            boxShadow: "0 2px 0 #c9b8a0",
          }}
        >
          {/* Binding / vault hinge */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 8,
              bottom: 8,
              width: 5,
              background: "#c4a574",
              borderTopRightRadius: 2,
              borderBottomRightRadius: 2,
              display: "flex",
            }}
          />
          {/* Keyhole */}
          <div
            style={{
              position: "absolute",
              top: 14,
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#f5efe6",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 20,
              width: 4,
              height: 8,
              background: "#f5efe6",
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              display: "flex",
            }}
          />
          {/* N mark */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              color: "#f5efe6",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: -1,
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
