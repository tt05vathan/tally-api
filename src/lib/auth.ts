import { getSystemToken } from "./config";
import { jsonError } from "./response";

export function requireSystemToken(
  request: Request,
): Response | null {
  // Env var (Vercel): SYSTEM_TOKEN
  // HTTP header: SYSTEM_TOKEN
  const token =
    request.headers.get("SYSTEM_TOKEN") ??
    request.headers.get("system_token");
  let expected: string;

  try {
    expected = getSystemToken();
  } catch {
    return jsonError("Server misconfigured: SYSTEM_TOKEN missing", 500);
  }

  if (!token || token !== expected) {
    return jsonError("Unauthorized", 401);
  }

  return null;
}
