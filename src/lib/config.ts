export function getSystemToken(): string {
  const token = process.env.SYSTEM_TOKEN;
  if (!token) {
    throw new Error("SYSTEM_TOKEN is not configured");
  }
  return token;
}
