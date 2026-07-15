/**
 * Removes _schema templates and seeds records from scripts/seed-sample.json
 *
 * JSON format: same as Tally API GET responses (SALEORDERS, PURCHASEBILLS, etc.)
 * Script adds orderid, sync_status, entity_type automatically.
 *
 * Usage:
 *   npm run seed:firestore
 *   npm run seed:firestore -- scripts/my-custom-seed.json
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { Firestore } from "firebase-admin/firestore";
import { initAdminDb } from "./firebaseAdmin";

const COLLECTIONS = [
  "sale_orders",
  "purchase_bills",
  "credit_notes",
  "debit_notes",
  "suppliers",
  "masterlist",
  "customers",
] as const;

const SCHEMA_DOC_ID = "_schema";

type CollectionName = (typeof COLLECTIONS)[number];

type SeedMapping = {
  responseKey: keyof SeedFile;
  collection: CollectionName;
  entityType: CollectionName;
  orderidField: string;
};

type SeedFile = {
  SALEORDERS?: Record<string, unknown>[];
  PURCHASEBILLS?: Record<string, unknown>[];
  CREDITNOTES?: Record<string, unknown>[];
  DEBITNOTES?: Record<string, unknown>[];
  SUPPLIERS?: Record<string, unknown>[];
  PRODUCTS?: Record<string, unknown>[];
  CUSTOMERS?: Record<string, unknown>[];
};

const MAPPINGS: SeedMapping[] = [
  {
    responseKey: "SALEORDERS",
    collection: "sale_orders",
    entityType: "sale_orders",
    orderidField: "ID",
  },
  {
    responseKey: "PURCHASEBILLS",
    collection: "purchase_bills",
    entityType: "purchase_bills",
    orderidField: "ID",
  },
  {
    responseKey: "CREDITNOTES",
    collection: "credit_notes",
    entityType: "credit_notes",
    orderidField: "ID",
  },
  {
    responseKey: "DEBITNOTES",
    collection: "debit_notes",
    entityType: "debit_notes",
    orderidField: "ID",
  },
  {
    responseKey: "SUPPLIERS",
    collection: "suppliers",
    entityType: "suppliers",
    orderidField: "SUPPLIERCODE",
  },
  {
    responseKey: "PRODUCTS",
    collection: "masterlist",
    entityType: "masterlist",
    orderidField: "PRODUCTCODE",
  },
  {
    responseKey: "CUSTOMERS",
    collection: "customers",
    entityType: "customers",
    orderidField: "CUSTOMERCODE",
  },
];

function loadSeedFile(): SeedFile {
  const argPath = process.argv[2];
  const filePath = resolve(
    process.cwd(),
    argPath ?? "scripts/seed-sample.json",
  );

  if (!existsSync(filePath)) {
    throw new Error(
      `Seed file not found: ${filePath}\nEdit scripts/seed-sample.json or pass a path: npm run seed:firestore -- path/to/your.json`,
    );
  }

  return JSON.parse(readFileSync(filePath, "utf8")) as SeedFile;
}

function toDocId(collection: string, orderid: string): string {
  const safe = orderid.replace(/\//g, "__");
  return `seed-${collection}-${safe}`;
}

function buildFirestoreDoc(
  record: Record<string, unknown>,
  mapping: SeedMapping,
): { docId: string; data: Record<string, unknown> } {
  const orderid = record[mapping.orderidField];
  if (typeof orderid !== "string" || !orderid) {
    throw new Error(
      `${mapping.responseKey} record missing ${mapping.orderidField}: ${JSON.stringify(record)}`,
    );
  }

  return {
    docId: toDocId(mapping.collection, orderid),
    data: {
      ...record,
      orderid,
      sync_status: "PENDING",
      entity_type: mapping.entityType,
    },
  };
}

async function removeSchemaDocs(db: Firestore) {
  for (const collection of COLLECTIONS) {
    const ref = db.collection(collection).doc(SCHEMA_DOC_ID);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
      console.log(`  ✓ deleted ${collection}/${SCHEMA_DOC_ID}`);
    }

    const leftovers = await db
      .collection(collection)
      .where("orderid", "==", "__schema__")
      .get();
    for (const doc of leftovers.docs) {
      await doc.ref.delete();
      console.log(`  ✓ deleted leftover ${collection}/${doc.id}`);
    }
  }
}

async function removePreviousSeeds(db: Firestore) {
  for (const collection of COLLECTIONS) {
    const snapshot = await db
      .collection(collection)
      .where("entity_type", "==", collection)
      .get();

    for (const doc of snapshot.docs) {
      if (doc.id.startsWith("seed-")) {
        await doc.ref.delete();
        console.log(`  ✓ removed old seed ${collection}/${doc.id}`);
      }
    }
  }
}

async function main() {
  const seedFile = loadSeedFile();
  const { db, projectId } = initAdminDb();

  console.log(`Seeding Firestore project: ${projectId}\n`);

  console.log("Removing _schema templates...");
  await removeSchemaDocs(db);

  console.log("\nRemoving previous seed-* documents...");
  await removePreviousSeeds(db);

  console.log("\nSeeding from JSON...");
  let total = 0;

  for (const mapping of MAPPINGS) {
    const records = seedFile[mapping.responseKey] ?? [];
    if (!records.length) {
      console.log(`  - ${mapping.responseKey}: (empty, skipped)`);
      continue;
    }

    for (const record of records) {
      const { docId, data } = buildFirestoreDoc(record, mapping);
      await db.collection(mapping.collection).doc(docId).set(data);
      console.log(
        `  ✓ ${mapping.collection}/${docId}  (orderid=${String(data.orderid)})`,
      );
      total += 1;
    }
  }

  if (total === 0) {
    console.log("\nNo records found in JSON. Add data to scripts/seed-sample.json");
    return;
  }

  console.log(`\nDone. Seeded ${total} PENDING record(s).`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
