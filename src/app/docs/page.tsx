"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <p style={{ fontFamily: "system-ui", padding: "2rem" }}>
      Loading Swagger…
    </p>
  ),
});

export default function DocsPage() {
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
      <div
        style={{
          fontFamily: "system-ui",
          padding: "1rem 1.5rem",
          background: "#f8fafc",
        }}
      >
        <p style={{ margin: 0 }}>
          Click <b>Authorize</b> (top right), paste your{" "}
          <code>X-System-Token</code> value (from <code>.env.local</code>{" "}
          → <code>SYSTEM_TOKEN</code>, e.g. <code>dev-token-123</code>), then
          use <b>Try it out</b> on each endpoint.
        </p>
      </div>
      <SwaggerUI
        url="/openapi.json"
        docExpansion="list"
        defaultModelsExpandDepth={-1}
        persistAuthorization
        tryItOutEnabled
      />
    </div>
  );
}
