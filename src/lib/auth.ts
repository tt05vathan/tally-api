import { getSystemToken } from "./config";
import { jsonError } from "./response";

export function requireSystemToken(
  request: Request,
): Response | null {
  const token = request.headers.get("X-System-Token");
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
