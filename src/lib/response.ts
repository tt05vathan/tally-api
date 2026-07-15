import { NextResponse } from "next/server";

const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, SYSTEM_TOKEN, system_token, Authorization",
};

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

export function ackOk(recordId: string, syncStatus: "SYNCED" | "FAILED") {
  return NextResponse.json(
    {
      SUCCESS: true,
      DATA: {
        RECORD_ID: recordId,
        SYNC_STATUS: syncStatus,
      },
      META: {
        message: "Acknowledgement processed successfully",
      },
    },
    { headers: CORS_HEADERS },
  );
}

export function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      SUCCESS: false,
      ERROR: message,
      ...extra,
    },
    { status, headers: CORS_HEADERS },
  );
}
