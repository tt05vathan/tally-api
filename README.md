# Tally Sync API

Next.js (App Router) backend for Tally integration sync. Serves PENDING records from Cloud Firestore and processes acknowledgements.

## Setup

1. Copy `.env.example` to `.env.local` and fill in values.
2. Install and run:

```bash
npm install
npm run init:firestore   # creates all collections + field templates
npm run seed:firestore   # optional sample PENDING data
npm run dev
```

## API docs

With the server running:

- [http://localhost:3000/redoc](http://localhost:3000/redoc) — Redoc reference
- [http://localhost:3000/docs](http://localhost:3000/docs) — Swagger UI (Authorize with `X-System-Token`, then Try it out)

OpenAPI spec: [`public/openapi.json`](public/openapi.json)

## Endpoints

All require header `X-System-Token`.

| Method | Path |
|---|---|
| GET | `/api/tally/sale-orders` |
| GET | `/api/tally/purchase-bills` |
| GET | `/api/tally/credit-notes` |
| GET | `/api/tally/debit-notes` |
| GET | `/api/tally/suppliers` |
| GET | `/api/tally/masterlist` |
| GET | `/api/tally/customers` |
| POST | `/api/tally/ack/{orderid}` |

See [docs/FIRESTORE_SCHEMA.md](docs/FIRESTORE_SCHEMA.md) for how writers should structure Firestore documents.

## Deploy (Vercel)

1. Push the repo and import the project in Vercel.
2. Set env vars: `SYSTEM_TOKEN`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
3. Deploy.
