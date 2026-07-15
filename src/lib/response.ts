import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function ackOk(recordId: string, syncStatus: "SYNCED" | "FAILED") {
  return NextResponse.json({
    SUCCESS: true,
    DATA: {
      RECORD_ID: recordId,
      SYNC_STATUS: syncStatus,
    },
    META: {
      message: "Acknowledgement processed successfully",
    },
  });
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
    { status },
  );
}
