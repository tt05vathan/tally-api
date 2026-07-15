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

const DEFAULT_PURCHASE_LEDGERS = [
  { LEDGERNAME: "Transport charges", AMOUNT: null },
  { LEDGERNAME: "gst", AMOUNT: null },
];

/** Stable key order for API responses (Firestore does not preserve write order). */
export const RESPONSE_FIELD_ORDER: Record<EntityType, string[]> = {
  sale_orders: [
    "ID",
    "ORDERNO",
    "ORDERDATE",
    "TRANSACTIONNO",
    "DATE",
    "PARTYNAME",
    "PARTYADDRESS1",
    "PARTYADDRESS2",
    "PARTYADDRESS3",
    "PARTYPINCODE",
    "PARTYSTATE",
    "PARTYGST",
    "SALEACCOUNT",
    "PRICELEVEL",
    "TOTALVALUE",
    "PRODUCTS",
  ],
  purchase_bills: [
    "ID",
    "ORDERNO",
    "ORDERDATE",
    "TRANSACTIONNO",
    "DATE",
    "PARTYNAME",
    "PARTYADDRESS1",
    "PARTYADDRESS2",
    "PARTYADDRESS3",
    "PARTYSTATE",
    "PARTYPINCODE",
    "PURCHASEACCOUNT",
    "TOTALVALUE",
    "PRODUCTS",
    "LEDGERSDATA",
  ],
  credit_notes: [
    "ID",
    "CREDITNOTENO",
    "DATE",
    "ORDERID",
    "ORDERDATE",
    "PARTYNAME",
    "PRICELEVEL",
    "PRODUCTS",
  ],
  debit_notes: [
    "ID",
    "DEBITNOTENO",
    "DATE",
    "ORDERID",
    "ORDERDATE",
    "PARTYNAME",
    "AMOUNT",
    "PRODUCTS",
  ],
  suppliers: [
    "SUPPLIERCODE",
    "SUPPLIERNAME",
    "GSTIN",
    "ADDRESS1",
    "ADDRESS2",
    "ADDRESS3",
    "COUNTRY",
    "PINCODE",
    "PHONENUMBER",
    "PAN",
    "CATEGORY",
    "PRICELEVEL",
    "STATE",
  ],
  masterlist: [
    "PRODUCTCODE",
    "PRODUCTNAME",
    "BRAND",
    "HSN",
    "CATEGORY",
    "UOM",
    "GSTPER",
    "DECIMALPLACES",
    "APPLICABLEDATE",
    "PAN",
  ],
  customers: [
    "CUSTOMERCODE",
    "CUSTOMERNAME",
    "GSTIN",
    "ADDRESS1",
    "ADDRESS2",
    "ADDRESS3",
    "COUNTRY",
    "PINCODE",
    "PHONENUMBER",
    "PAN",
    "CATEGORY",
    "PRICELEVEL",
    "STATE",
  ],
};

const PURCHASE_PRODUCT_ORDER = [
  "PRODUCTCODE",
  "PRODUCTNAME",
  "QTY",
  "RATE",
  "AMOUNT",
  "GSTPERCENT",
  "HSN",
] as const;

const SALE_PRODUCT_ORDER = [
  "PRODUCTCODE",
  "PRODUCTNAME",
  "QTY",
  "RATE",
  "AMOUNT",
  "GSTPERCENT",
  "HSN",
  "DISCOUNT",
  "FINALAMOUNT",
] as const;

const NOTE_PRODUCT_ORDER = [
  "PRODUCTCODE",
  "PRODUCTNAME",
  "QTY",
  "RATE",
  "AMOUNT",
  "GSTPER",
  "TOTALAMOUNT",
] as const;

const LEDGER_ORDER = ["LEDGERNAME", "AMOUNT"] as const;

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

function orderObject(
  source: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keys) {
    ordered[key] = Object.prototype.hasOwnProperty.call(source, key)
      ? source[key]
      : null;
  }
  return ordered;
}

function orderProductArray(
  products: unknown,
  keys: readonly string[],
): Record<string, unknown>[] {
  if (!Array.isArray(products)) return [];
  return products.map((item) => {
    if (!item || typeof item !== "object") return orderObject({}, keys);
    return orderObject(item as Record<string, unknown>, keys);
  });
}

function orderLedgerArray(ledgers: unknown): Record<string, unknown>[] {
  if (!Array.isArray(ledgers) || ledgers.length === 0) {
    return DEFAULT_PURCHASE_LEDGERS.map((ledger) => ({ ...ledger }));
  }
  return ledgers.map((item) => {
    if (!item || typeof item !== "object") {
      return orderObject({}, LEDGER_ORDER);
    }
    return orderObject(item as Record<string, unknown>, LEDGER_ORDER);
  });
}

/**
 * Strip sync metadata and return API payload in the Tally contract field order.
 * Purchase bills always include LEDGERSDATA (defaults if missing in Firestore).
 */
export function stripSyncMetadata(
  doc: Record<string, unknown>,
  collection?: EntityType,
): Record<string, unknown> {
  const withoutMeta: Record<string, unknown> = { ...doc };
  for (const key of SYNC_META_KEYS) {
    delete withoutMeta[key];
  }

  if (!collection) return withoutMeta;

  const prepared: Record<string, unknown> = { ...withoutMeta };

  if (collection === "purchase_bills") {
    prepared.PRODUCTS = orderProductArray(
      prepared.PRODUCTS,
      PURCHASE_PRODUCT_ORDER,
    );
    prepared.LEDGERSDATA = orderLedgerArray(prepared.LEDGERSDATA);
  } else if (collection === "sale_orders") {
    prepared.PRODUCTS = orderProductArray(prepared.PRODUCTS, SALE_PRODUCT_ORDER);
  } else if (
    collection === "credit_notes" ||
    collection === "debit_notes"
  ) {
    prepared.PRODUCTS = orderProductArray(prepared.PRODUCTS, NOTE_PRODUCT_ORDER);
  }

  const order = RESPONSE_FIELD_ORDER[collection];
  const ordered: Record<string, unknown> = {};
  for (const key of order) {
    if (Object.prototype.hasOwnProperty.call(prepared, key)) {
      ordered[key] = prepared[key];
    } else if (collection === "purchase_bills" && key === "LEDGERSDATA") {
      ordered[key] = orderLedgerArray(undefined);
    } else {
      ordered[key] = null;
    }
  }
  return ordered;
}
