import { z } from "zod";

export const SYNC_STATUSES = ["PENDING", "SYNCED", "FAILED"] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const ENTITY_TYPES = [
  "sale_orders",
  "purchase_bills",
  "credit_notes",
  "debit_notes",
  "suppliers",
  "masterlist",
  "customers",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

/** Fields stored on docs but never returned by Tally GET APIs */
export const SYNC_META_KEYS = [
  "orderid",
  "sync_status",
  "entity_type",
] as const;

export const ackBodySchema = z.object({
  STATUS: z.enum(["success", "failed"]),
});

export type AckBody = z.infer<typeof ackBodySchema>;

export type EntityDefinition = {
  collection: EntityType;
  responseKey: string;
  path: string;
};

export const ENTITY_REGISTRY: EntityDefinition[] = [
  {
    collection: "sale_orders",
    responseKey: "SALEORDERS",
    path: "sale-orders",
  },
  {
    collection: "purchase_bills",
    responseKey: "PURCHASEBILLS",
    path: "purchase-bills",
  },
  {
    collection: "credit_notes",
    responseKey: "CREDITNOTES",
    path: "credit-notes",
  },
  {
    collection: "debit_notes",
    responseKey: "DEBITNOTES",
    path: "debit-notes",
  },
  {
    collection: "suppliers",
    responseKey: "SUPPLIERS",
    path: "suppliers",
  },
  {
    collection: "masterlist",
    responseKey: "PRODUCTS",
    path: "masterlist",
  },
  {
    collection: "customers",
    responseKey: "CUSTOMERS",
    path: "customers",
  },
];

export function stripSyncMetadata(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...doc };
  for (const key of SYNC_META_KEYS) {
    delete result[key];
  }
  return result;
}
