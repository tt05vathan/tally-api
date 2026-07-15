import { requireSystemToken } from "@/lib/auth";
import { ackOk, jsonError } from "@/lib/response";
import { acknowledge } from "@/services/syncService";
import { ackBodySchema } from "@/types/tally";

type RouteContext = {
  params: Promise<{ recordId: string[] }>;
};

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = requireSystemToken(request);
  if (unauthorized) return unauthorized;

  const { recordId: segments } = await context.params;
  const recordId = segments?.join("/") ?? "";

  if (!recordId) {
    return jsonError("RECORD_ID is required", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = ackBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('STATUS must be "success" or "failed"', 400);
  }

  try {
    const result = await acknowledge(recordId, parsed.data.STATUS);
    if (!result) {
      return jsonError(`Record not found for orderid: ${recordId}`, 404);
    }
    return ackOk(result.RECORD_ID, result.SYNC_STATUS as "SYNCED" | "FAILED");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process acknowledgement";
    return jsonError(message, 500);
  }
}
