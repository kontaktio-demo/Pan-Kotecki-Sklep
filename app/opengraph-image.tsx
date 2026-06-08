import { ImageResponse } from "next/og";

export const alt = "Pan Kotecki - sklep dla kotów i ich ludzi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8f4ec",
          color: "#1d1810",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: "-2px" }}>
          Pan Kotecki<span style={{ color: "#ef7a30" }}>.</span>
        </div>
        <div style={{ fontSize: 36, color: "#7c7264", marginTop: 14 }}>Sklep dla kotów i ich ludzi</div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#ffffff",
            background: "#ee5340",
            padding: "12px 28px",
            borderRadius: 999,
            marginTop: 36,
            fontWeight: 600,
          }}
        >
          Wysyłka 24h  -  Darmowa dostawa od 149 zł
        </div>
      </div>
    ),
    { ...size },
  );
}
