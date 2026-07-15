/**
 * Creates all Tally Firestore collections with full field templates.
 * Template docs use orderid "__schema__" and sync_status "SYNCED"
 * so they never appear in PENDING GET APIs.
 *
 * Usage:
 *   npm run init:firestore
 *
 * Auth (either):
 *   - Put downloaded JSON as serviceAccountKey.json in project root (easiest)
 *   - Or set FIREBASE_* vars in .env.local
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseCredentialInputs } from "../src/lib/firebaseCredentials";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const { projectId, clientEmail, privateKey } = getFirebaseCredentialInputs();

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const db = getFirestore();

const SCHEMA_DOC_ID = "_schema";
const SCHEMA_ORDERID = "__schema__";

type CollectionTemplate = {
  collection: string;
  fields: Record<string, unknown>;
};

const saleProductTemplate = {
  PRODUCTCODE: null,
  PRODUCTNAME: null,
  QTY: null,
  RATE: null,
  AMOUNT: null,
  GSTPERCENT: null,
  HSN: null,
  DISCOUNT: null,
  FINALAMOUNT: null,
};

const purchaseProductTemplate = {
  PRODUCTCODE: null,
  PRODUCTNAME: null,
  QTY: null,
  RATE: null,
  AMOUNT: null,
  GSTPERCENT: null,
  HSN: null,
};

const noteProductTemplate = {
  PRODUCTCODE: null,
  PRODUCTNAME: null,
  QTY: null,
  RATE: null,
  AMOUNT: null,
  GSTPER: null,
  TOTALAMOUNT: null,
};

const ledgerTemplate = {
  LEDGERNAME: null,
  AMOUNT: null,
};

const templates: CollectionTemplate[] = [
  {
    collection: "sale_orders",
    fields: {
      ID: null,
      ORDERNO: null,
      ORDERDATE: null,
      TRANSACTIONNO: null,
      DATE: null,
      PARTYNAME: null,
      PARTYADDRESS1: null,
      PARTYADDRESS2: null,
      PARTYADDRESS3: null,
      PARTYPINCODE: null,
      PARTYSTATE: null,
      PARTYGST: null,
      SALEACCOUNT: null,
      PRICELEVEL: null,
      TOTALVALUE: null,
      PRODUCTS: [saleProductTemplate],
      orderid: SCHEMA_ORDERID,
      sync_status: "SYNCED",
      entity_type: "sale_orders",
    },
  },
  {
    collection: "purchase_bills",
    fields: {
      ID: null,
      ORDERNO: null,
      ORDERDATE: null,
      TRANSACTIONNO: null,
      DATE: null,
      PARTYNAME: null,
      PARTYADDRESS1: null,
      PARTYADDRESS2: null,
      PARTYADDRESS3: null,
      PARTYSTATE: null,
      PARTYPINCODE: null,
      PURCHASEACCOUNT: null,
      TOTALVALUE: null,
      PRODUCTS: [purchaseProductTemplate],
      LEDGERSDATA: [ledgerTemplate],
      orderid: SCHEMA_ORDERID,
      sync_status: "SYNCED",
      entity_type: "purchase_bills",
    },
  },
  {
    collection: "credit_notes",
    fields: {
      ID: null,
      CREDITNOTENO: null,
      DATE: null,
      ORDERID: null,
      ORDERDATE: null,
      PARTYNAME: null,
      PRICELEVEL: null,
      PRODUCTS: [noteProductTemplate],
      orderid: SCHEMA_ORDERID,
      sync_status: "SYNCED",
      entity_type: "credit_notes",
    },
  },
  {
    collection: "debit_notes",
    fields: {
      ID: null,
      DEBITNOTENO: null,
      DATE: null,
      ORDERID: null,
      ORDERDATE: null,
      PARTYNAME: null,
      AMOUNT: null,
      PRODUCTS: [noteProductTemplate],
      orderid: SCHEMA_ORDERID,
      sync_status: "SYNCED",
      entity_type: "debit_notes",
    },
  },
  {
    collection: "suppliers",
    fields: {
      SUPPLIERCODE: null,
      SUPPLIERNAME: null,
      GSTIN: null,
      ADDRESS1: null,
      ADDRESS2: null,
      ADDRESS3: null,
      COUNTRY: null,
      PINCODE: null,
      PHONENUMBER: null,
      PAN: null,
      CATEGORY: null,
      PRICELEVEL: null,
      STATE: null,
      orderid: SCHEMA_ORDERID,
      sync_status: "SYNCED",
      entity_type: "suppliers",
    },
  },
  {
    collection: "masterlist",
    fields: {
      PRODUCTCODE: null,
      PRODUCTNAME: null,
      BRAND: null,
      HSN: null,
      CATEGORY: null,
      UOM: null,
      GSTPER: null,
      DECIMALPLACES: null,
      APPLICABLEDATE: null,
      PAN: null,
      orderid: SCHEMA_ORDERID,
      sync_status: "SYNCED",
      entity_type: "masterlist",
    },
  },
  {
    collection: "customers",
    fields: {
      CUSTOMERCODE: null,
      CUSTOMERNAME: null,
      GSTIN: null,
      ADDRESS1: null,
      ADDRESS2: null,
      ADDRESS3: null,
      COUNTRY: null,
      PINCODE: null,
      PHONENUMBER: null,
      PAN: null,
      CATEGORY: null,
      PRICELEVEL: null,
      STATE: null,
      orderid: SCHEMA_ORDERID,
      sync_status: "SYNCED",
      entity_type: "customers",
    },
  },
];

async function main() {
  console.log(`Initializing Firestore collections in project: ${projectId}`);

  for (const { collection, fields } of templates) {
    const ref = db.collection(collection).doc(SCHEMA_DOC_ID);
    await ref.set(fields, { merge: true });
    console.log(`✓ ${collection}  (doc: ${SCHEMA_DOC_ID}, fields: ${Object.keys(fields).length})`);
  }

  console.log("\nDone. Collections and field templates created.");
  console.log('Template docs use sync_status "SYNCED" so GET /api/tally/* will ignore them.');
  console.log("Next: seed real PENDING documents when ready.");
}

main().catch((err) => {
  console.error("Init failed:", err);
  process.exit(1);
});
