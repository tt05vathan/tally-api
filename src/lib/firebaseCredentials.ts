import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

export type FirebaseCredentialInputs = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function loadServiceAccountFromFile(): ServiceAccountJson | null {
  const pathFromEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const candidates = [
    pathFromEnv,
    "serviceAccountKey.json",
    "firebase-service-account.json",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const fullPath = resolve(process.cwd(), candidate);
    if (!existsSync(fullPath)) continue;

    const raw = JSON.parse(readFileSync(fullPath, "utf8")) as ServiceAccountJson;
    if (!raw.project_id || !raw.client_email || !raw.private_key) {
      throw new Error(`Invalid service account JSON at ${fullPath}`);
    }
    return raw;
  }

  return null;
}

export function getFirebaseCredentialInputs(): FirebaseCredentialInputs {
  const fromFile = loadServiceAccountFromFile();
  if (fromFile) {
    return {
      projectId: fromFile.project_id,
      clientEmail: fromFile.client_email,
      privateKey: fromFile.private_key.replace(/\\n/g, "\n"),
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase credentials missing. Put the downloaded JSON as serviceAccountKey.json in the project root, or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY is invalid. It must be the full PEM from the service account JSON (starts with "-----BEGIN PRIVATE KEY-----"), not a short hash/API key.',
    );
  }

  return { projectId, clientEmail, privateKey };
}
