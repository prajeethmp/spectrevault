import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { vaultStore } from "@/lib/store";

const MAX_CIPHERTEXT_SIZE = parseInt(process.env.MAX_CIPHERTEXT_SIZE_BYTES || "10485760", 10);
const MAX_TTL_MINUTES = parseInt(process.env.MAX_TTL_MINUTES || "10080", 10);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ciphertext, ttlMinutes = 60 } = body;

    if (!ciphertext || typeof ciphertext !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'ciphertext' field." },
        { status: 400 }
      );
    }

    if (ciphertext.length > MAX_CIPHERTEXT_SIZE) {
      return NextResponse.json(
        { error: `Payload exceeds limit of ${MAX_CIPHERTEXT_SIZE / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    const ttl = Math.min(Math.max(Number(ttlMinutes) || 60, 1), MAX_TTL_MINUTES);
    const id = crypto.randomBytes(16).toString("hex");
    const now = Date.now();
    const expiresAt = now + ttl * 60 * 1000;

    await vaultStore.set(id, {
      ciphertext,
      expiresAt,
      createdAt: now,
    });

    return NextResponse.json(
      {
        id,
        expiresAt,
        ttlMinutes: ttl,
        status: "sealed",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal error processing vault submission." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Parameter 'id' is required." },
      { status: 400 }
    );
  }

  const { record, expired } = await vaultStore.getAndBurn(id);

  if (expired) {
    return NextResponse.json(
      { error: "Vault expired before retrieval and was purged." },
      { status: 410 }
    );
  }

  if (!record) {
    return NextResponse.json(
      { error: "Vault not found, expired, or burned on a prior read." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      ciphertext: record.ciphertext,
      burned: true,
      accessedAt: new Date().toISOString(),
    },
    { status: 200 }
  );
}
