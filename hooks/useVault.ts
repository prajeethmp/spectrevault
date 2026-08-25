"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  encryptPayload,
  decryptPayload,
  SecretShare,
  EncryptedVaultPayload,
} from "@/lib/crypto";

export interface VaultStatus {
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export function useVault() {
  const [mode, setMode] = useState<"create" | "unlock">("create");

  // Create Mode
  const [secretText, setSecretText] = useState("");
  const [threshold, setThreshold] = useState(2);
  const [totalShares, setTotalShares] = useState(3);
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [isSealing, setIsSealing] = useState(false);

  // Output after sealing
  const [sealedData, setSealedData] = useState<{
    vaultId: string;
    expiresAt: number;
    shares: SecretShare[];
    shareLinks: string[];
    ciphertext: string;
  } | null>(null);

  // Unlock Mode
  const [inputVaultId, setInputVaultId] = useState("");
  const [shareInputs, setShareInputs] = useState<string[]>(["", ""]);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [detectedShareX, setDetectedShareX] = useState<number | null>(null);

  const [status, setStatus] = useState<VaultStatus | null>(null);

  // Inspect URL parameters on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const vaultParam = params.get("vault");
    const hash = window.location.hash.substring(1);

    if (vaultParam) {
      setMode("unlock");
      setInputVaultId(vaultParam);
    }

    if (hash) {
      try {
        const decoded = decodeURIComponent(hash);
        const parsed = JSON.parse(decoded) as SecretShare;
        if (typeof parsed.x === "number" && parsed.y) {
          setShareInputs([decoded, ""]);
          setDetectedShareX(parsed.x);
          setStatus({
            message: `Custodian share #${parsed.x} detected from URL. Enter remaining shares to reach quorum.`,
            type: "info",
          });
        }
      } catch (err) {
        console.debug("Could not parse URL hash as custodial share:", err);
      }
    }
  }, []);

  // Parse share input state
  const parsedShares = useMemo(() => {
    const list: SecretShare[] = [];
    const seen = new Set<number>();
    let invalidCount = 0;

    for (const raw of shareInputs) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      try {
        const p = JSON.parse(trimmed);
        if (typeof p.x === "number" && typeof p.y === "string" && p.y.length > 0) {
          if (!seen.has(p.x)) {
            seen.add(p.x);
            list.push(p);
          }
        } else {
          invalidCount++;
        }
      } catch {
        invalidCount++;
      }
    }

    return {
      validShares: list,
      count: list.length,
      invalidCount,
    };
  }, [shareInputs]);

  // Seal secret action
  const seal = useCallback(async () => {
    if (!secretText.trim()) {
      setStatus({ message: "Payload content is empty.", type: "warning" });
      return;
    }

    try {
      setIsSealing(true);
      setStatus({
        message: "Deriving polynomial in GF(2⁸) and encrypting AES-256-GCM payload...",
        type: "info",
      });

      const encrypted: EncryptedVaultPayload = await encryptPayload(
        secretText,
        threshold,
        totalShares
      );

      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: encrypted.ciphertext,
          ttlMinutes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with status ${res.status}`);
      }

      const { id, expiresAt } = await res.json();
      const origin = window.location.origin + window.location.pathname;
      const links = encrypted.shares.map(
        (s) => `${origin}?vault=${id}#${encodeURIComponent(JSON.stringify(s))}`
      );

      setSealedData({
        vaultId: id,
        expiresAt,
        shares: encrypted.shares,
        shareLinks: links,
        ciphertext: encrypted.ciphertext,
      });

      setStatus({
        message: `Vault ${id.slice(0, 8)} locked on edge memory. Split into ${totalShares} custodial shares (threshold: ${threshold}).`,
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Encryption error";
      setStatus({ message: `Sealing failed: ${msg}`, type: "error" });
    } finally {
      setIsSealing(false);
    }
  }, [secretText, threshold, totalShares, ttlMinutes]);

  // Unlock secret action
  const unlock = useCallback(async () => {
    if (!inputVaultId.trim()) {
      setStatus({ message: "Vault identifier is required.", type: "warning" });
      return;
    }

    if (parsedShares.count < 2) {
      setStatus({
        message: "At least 2 valid custodian shares are required to reconstruct.",
        type: "warning",
      });
      return;
    }

    try {
      setIsUnlocking(true);
      setStatus({
        message: "Retrieving ciphertext (triggering atomic edge memory burn)...",
        type: "info",
      });

      const res = await fetch(`/api/vault?id=${encodeURIComponent(inputVaultId.trim())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.error || "Vault not found, expired, or already destroyed by a prior read."
        );
      }

      const { ciphertext } = await res.json();

      setStatus({
        message: "Evaluating Lagrange interpolation in GF(2⁸) to recover master key...",
        type: "info",
      });

      const plaintext = await decryptPayload(ciphertext, parsedShares.validShares);
      setDecryptedText(plaintext);

      setStatus({
        message: "Key reconstructed and payload decrypted. Vault permanently burned on server.",
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Decryption error";
      setStatus({ message: `Unlock failed: ${msg}`, type: "error" });
    } finally {
      setIsUnlocking(false);
    }
  }, [inputVaultId, parsedShares]);

  const resetDecrypted = useCallback(() => {
    setDecryptedText(null);
    setStatus({
      message: "Plaintext wiped from local memory.",
      type: "info",
    });
  }, []);

  return {
    mode,
    setMode,
    secretText,
    setSecretText,
    threshold,
    setThreshold,
    totalShares,
    setTotalShares,
    ttlMinutes,
    setTtlMinutes,
    isSealing,
    sealedData,
    seal,
    inputVaultId,
    setInputVaultId,
    shareInputs,
    setShareInputs,
    parsedShares,
    isUnlocking,
    decryptedText,
    detectedShareX,
    unlock,
    resetDecrypted,
    status,
    setStatus,
  };
}
