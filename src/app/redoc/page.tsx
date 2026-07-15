"use client";

import dynamic from "next/dynamic";

const RedocStandalone = dynamic(
  () => import("redoc").then((mod) => mod.RedocStandalone),
  {
    ssr: false,
    loading: () => (
      <p style={{ fontFamily: "system-ui", padding: "2rem" }}>Loading Redoc…</p>
    ),
  },
);

export default function RedocPage() {
  return (
    <div>
      <div
        style={{
          fontFamily: "system-ui",
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          background: "#fff",
        }}
      >
        <strong>Tally Sync API</strong>
        <a href="/redoc">Redoc</a>
        <a href="/docs">Swagger</a>
        <a href="/">Home</a>
      </div>
      <RedocStandalone
        specUrl="/openapi.json"
        options={{
          hideDownloadButton: false,
          expandResponses: "200,400,401,404",
          pathInMiddlePanel: true,
          theme: {
            colors: {
              primary: { main: "#1f4b7a" },
            },
          },
        }}
      />
    </div>
  );
}
