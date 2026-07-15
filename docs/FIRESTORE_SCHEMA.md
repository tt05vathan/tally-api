# Firestore Schema for Tally Sync API

Writers (WOW or other services) create documents in these collections with `sync_status: "PENDING"`. The Tally Integration Service polls the GET APIs and then calls the ack endpoint.

## Initialize collections (field templates)

After `.env.local` has Firebase credentials:

```bash
npm run init:firestore
```

This creates all 7 collections with a `_schema` template document (all API fields present). Templates use `sync_status: "SYNCED"` and `orderid: "__schema__"` so they are **not** returned by PENDING GET APIs.

## Seed sample data

Edit `scripts/seed-sample.json` with your Tally API-shaped JSON (same keys as GET responses: `SALEORDERS`, `PURCHASEBILLS`, etc.). Use GST-style ids like `GST/26-27/0064` in the `ID` field.

```bash
npm run seed:firestore
```

Or pass a custom file:

```bash
npm run seed:firestore -- scripts/my-data.json
```

The script removes `_schema` docs, clears old `seed-*` docs, then inserts records with `sync_status: "PENDING"` and `orderid` from `ID` / `SUPPLIERCODE` / `PRODUCTCODE` / `CUSTOMERCODE`.

## Collections

| Collection | Response key (GET) | `orderid` should equal |
|---|---|---|
| `sale_orders` | `SALEORDERS` | `ID` |
| `purchase_bills` | `PURCHASEBILLS` | `ID` |
| `credit_notes` | `CREDITNOTES` | `ID` |
| `debit_notes` | `DEBITNOTES` | `ID` |
| `suppliers` | `SUPPLIERS` | `SUPPLIERCODE` |
| `masterlist` | `PRODUCTS` | `PRODUCTCODE` |
| `customers` | `CUSTOMERS` | `CUSTOMERCODE` |

## Document rules

- **Firestore document ID:** auto-generated (do not put slash-containing business ids in the doc id).
- **`orderid` (required):** business record id used by `POST /api/tally/ack/{orderid}`. May contain `/` (e.g. `CN/26-27/0001`).
- **`sync_status` (required):** `PENDING` | `SYNCED` | `FAILED`.
- **`entity_type` (recommended):** collection name, e.g. `credit_notes`.
- **Payload fields:** UPPERCASE keys matching the Tally API response shapes.
- GET responses **omit** `orderid`, `sync_status`, and `entity_type`.

## Ack behavior

- `STATUS: "success"` → sets `sync_status` to `SYNCED` only.
- `STATUS: "failed"` → sets `sync_status` to `FAILED` only.

## Example: credit note (PENDING)

```json
{
  "ID": "CN/26-27/0001",
  "CREDITNOTENO": "CN/26-27/0001",
  "DATE": "10-07-2026",
  "ORDERID": "42",
  "ORDERDATE": "10-07-2026",
  "PARTYNAME": "Acme Corp",
  "PRICELEVEL": "WHOLESALE",
  "PRODUCTS": [
    {
      "PRODUCTCODE": "SKU-001",
      "PRODUCTNAME": "Widget A",
      "QTY": 2,
      "RATE": 500.0,
      "AMOUNT": 1000.0,
      "GSTPER": null,
      "TOTALAMOUNT": null
    }
  ],
  "orderid": "CN/26-27/0001",
  "sync_status": "PENDING",
  "entity_type": "credit_notes"
}
```

## Example: sale order (PENDING)

```json
{
  "ID": "ORD-001",
  "ORDERNO": "ORD-001",
  "ORDERDATE": "10-07-2026",
  "TRANSACTIONNO": "ORD-001",
  "DATE": "10-07-2026",
  "PARTYNAME": "Acme Corp",
  "PARTYADDRESS1": "123 Main St",
  "PARTYADDRESS2": null,
  "PARTYADDRESS3": null,
  "PARTYPINCODE": 110001,
  "PARTYSTATE": "Delhi",
  "PARTYGST": "07AACCP1234Q1Z5",
  "SALEACCOUNT": null,
  "PRICELEVEL": "WHOLESALE",
  "TOTALVALUE": null,
  "PRODUCTS": [
    {
      "PRODUCTCODE": "SKU-001",
      "PRODUCTNAME": "Widget A",
      "QTY": 10,
      "RATE": null,
      "AMOUNT": null,
      "GSTPERCENT": null,
      "HSN": 84713000,
      "DISCOUNT": null,
      "FINALAMOUNT": null
    }
  ],
  "orderid": "ORD-001",
  "sync_status": "PENDING",
  "entity_type": "sale_orders"
}
```

## API endpoints

Auth: HTTP header `SYSTEM_TOKEN` (same name as the env var).

- `GET /api/tally/sale-orders`
- `GET /api/tally/purchase-bills`
- `GET /api/tally/credit-notes`
- `GET /api/tally/debit-notes`
- `GET /api/tally/suppliers`
- `GET /api/tally/masterlist`
- `GET /api/tally/customers`
- `POST /api/tally/ack/{orderid}` with body `{ "STATUS": "success" | "failed" }`
