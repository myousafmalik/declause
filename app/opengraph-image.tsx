import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE, BYTELAPSE } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `${SITE_NAME} - ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a0b2e 50%, #2a1055 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "white",
              color: "#0a0a0a",
              fontSize: 34,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            D
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 80,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            Legal docs, in plain English.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#c4b5fd",
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            Spot red flags, hidden clauses, and unfair terms before you click agree.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#a1a1aa",
          }}
        >
          <div style={{ display: "flex" }}>declause.bytelapse.com</div>
          <div style={{ display: "flex" }}>Built by {BYTELAPSE.name}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
