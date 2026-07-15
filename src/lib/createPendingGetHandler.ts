import { requireSystemToken } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { listPending } from "@/services/syncService";
import type { EntityType } from "@/types/tally";

export function createPendingGetHandler(
  collection: EntityType,
  responseKey: string,
) {
  return async function GET(request: Request) {
    const unauthorized = requireSystemToken(request);
    if (unauthorized) return unauthorized;

    try {
      const records = await listPending(collection);
      return jsonOk({ [responseKey]: records });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to list pending records";
      return jsonError(message, 500);
    }
  };
}
