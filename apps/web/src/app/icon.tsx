import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

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
          background: "linear-gradient(135deg,#ecfdf5,#ffffff)",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 96,
            background: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 60px rgba(5,150,105,0.35)",
            color: "white",
            fontSize: 140,
            fontWeight: 800,
            letterSpacing: -6,
          }}
        >
          WA
        </div>
      </div>
    ),
    size,
  );
}

