import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getFirebaseCredentialInputs } from "./firebaseCredentials";

let app: App | undefined;
let db: Firestore | undefined;

export function getFirebaseApp(): App {
  if (app) return app;

  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  const { projectId, clientEmail, privateKey } = getFirebaseCredentialInputs();
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  return app;
}

export function getDb(): Firestore {
  if (db) return db;
  getFirebaseApp();
  db = getFirestore();
  return db;
}
