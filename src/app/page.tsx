export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640 }}>
      <h1>Tally Sync API</h1>
      <p>Backend-only. Use /api/tally/* with header X-System-Token.</p>
      <ul>
        <li>
          <a href="/redoc">Redoc</a> — API reference
        </li>
        <li>
          <a href="/docs">Swagger</a> — try / test endpoints
        </li>
      </ul>
    </main>
  );
}
