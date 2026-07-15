import type { DocumentData, DocumentReference } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase";
import {
  ENTITY_TYPES,
  stripSyncMetadata,
  type EntityType,
  type SyncStatus,
} from "@/types/tally";

export type FoundByOrderId = {
  ref: DocumentReference;
  data: DocumentData;
  collection: EntityType;
};

export async function listPending(
  collection: EntityType,
): Promise<Record<string, unknown>[]> {
  const snapshot = await getDb()
    .collection(collection)
    .where("sync_status", "==", "PENDING")
    .get();

  return snapshot.docs.map((doc) =>
    stripSyncMetadata(doc.data() as Record<string, unknown>, collection),
  );
}

export async function findByOrderId(
  orderid: string,
): Promise<FoundByOrderId | null> {
  const db = getDb();

  const results = await Promise.all(
    ENTITY_TYPES.map(async (collection) => {
      const snapshot = await db
        .collection(collection)
        .where("orderid", "==", orderid)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        ref: doc.ref,
        data: doc.data(),
        collection,
      } satisfies FoundByOrderId;
    }),
  );

  return results.find((r) => r !== null) ?? null;
}

export async function acknowledge(
  orderid: string,
  status: "success" | "failed",
): Promise<{ RECORD_ID: string; SYNC_STATUS: SyncStatus } | null> {
  const found = await findByOrderId(orderid);
  if (!found) return null;

  const syncStatus: SyncStatus = status === "success" ? "SYNCED" : "FAILED";
  await found.ref.update({ sync_status: syncStatus });

  return {
    RECORD_ID: orderid,
    SYNC_STATUS: syncStatus,
  };
}
