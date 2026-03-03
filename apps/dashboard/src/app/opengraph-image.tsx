import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "PincerPay — On-chain payments for AI agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logoData = await readFile(
    join(process.cwd(), "public", "logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "#070300",
          fontFamily: "sans-serif",
        }}
      >
        {/* Subtle gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle at top right, rgba(249,115,22,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Bottom border accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #F97316, #FB923C, #F97316)",
            display: "flex",
          }}
        />

        {/* Logo + wordmark row */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={80} height={80} alt="" />
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#fafafa",
              letterSpacing: "-0.02em",
            }}
          >
            PincerPay
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 400,
            color: "#a1a1aa",
            marginTop: "32px",
            lineHeight: 1.4,
            maxWidth: "800px",
          }}
        >
          On-chain payments for AI agents
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: "22px",
            fontWeight: 400,
            color: "#71717a",
            marginTop: "20px",
            lineHeight: 1.5,
            maxWidth: "700px",
          }}
        >
          USDC settlement on Solana via the x402 protocol
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            right: "80px",
            fontSize: "20px",
            color: "#F97316",
            fontWeight: 500,
          }}
        >
          pincerpay.com
        </div>
      </div>
    ),
    { ...size },
  );
}
