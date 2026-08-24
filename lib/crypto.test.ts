import { describe, it, expect } from "vitest";
import {
  gfMul,
  gfDiv,
  splitSecret,
  combineShares,
  encryptPayload,
  decryptPayload,
  SecretShare,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from "./crypto";
import { ThresholdError, CorruptedShareError, DecryptionError } from "./errors";

describe("Galois Field GF(2^8) Arithmetic", () => {
  it("satisfies multiplicative identity and zero properties", () => {
    expect(gfMul(0, 42)).toBe(0);
    expect(gfMul(42, 0)).toBe(0);
    expect(gfMul(1, 42)).toBe(42);
    expect(gfMul(42, 1)).toBe(42);
  });

  it("satisfies division as the exact inverse of multiplication", () => {
    for (let a = 1; a < 256; a += 11) {
      for (let b = 1; b < 256; b += 13) {
        const prod = gfMul(a, b);
        expect(gfDiv(prod, a)).toBe(b);
        expect(gfDiv(prod, b)).toBe(a);
      }
    }
  });

  it("throws on division by zero", () => {
    expect(() => gfDiv(10, 0)).toThrow("Division by zero in GF(2^8)");
  });
});

describe("Base64 Chunked Encoding Helpers", () => {
  it("encodes and decodes arbitrary byte vectors correctly", () => {
    const raw = new Uint8Array([0, 1, 255, 128, 64, 32, 16, 8, 4, 2, 1]);
    const b64 = uint8ArrayToBase64(raw);
    const decoded = base64ToUint8Array(b64);
    expect(decoded).toEqual(raw);
  });

  it("handles 100KB+ byte buffers without stack exhaustion", () => {
    const large = new Uint8Array(128 * 1024);
    for (let i = 0; i < large.length; i++) {
      large[i] = i % 256;
    }
    const b64 = uint8ArrayToBase64(large);
    const decoded = base64ToUint8Array(b64);
    expect(decoded.length).toBe(128 * 1024);
    expect(decoded).toEqual(large);
  });

  it("throws CorruptedShareError on invalid base64 input", () => {
    expect(() => base64ToUint8Array("%%%InvalidBase64%%%")).toThrow(CorruptedShareError);
  });
});

describe("Shamir Secret Sharing (k-of-n)", () => {
  it("reconstructs secret from exact quorum (2-of-3)", () => {
    const secret = new Uint8Array([137, 42, 99, 255, 12, 0, 77]);
    const shares = splitSecret(secret, 2, 3);
    expect(shares.length).toBe(3);

    expect(combineShares([shares[0], shares[1]])).toEqual(secret);
    expect(combineShares([shares[0], shares[2]])).toEqual(secret);
    expect(combineShares([shares[1], shares[2]])).toEqual(secret);
  });

  it("reconstructs secret from 3-of-5 threshold configuration", () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const shares = splitSecret(secret, 3, 5);

    expect(combineShares([shares[0], shares[1], shares[2]])).toEqual(secret);
    expect(combineShares([shares[1], shares[3], shares[4]])).toEqual(secret);
    expect(combineShares([shares[0], shares[2], shares[4]])).toEqual(secret);
  });

  it("handles higher thresholds like 4-of-7 and 5-of-9", () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const shares = splitSecret(secret, 4, 7);

    const subset1 = [shares[0], shares[2], shares[4], shares[6]];
    expect(combineShares(subset1)).toEqual(secret);

    const subset2 = [shares[1], shares[3], shares[5], shares[6]];
    expect(combineShares(subset2)).toEqual(secret);

    // Insufficient shares (3 shares for threshold 4)
    const insufficient = [shares[0], shares[1], shares[2]];
    expect(combineShares(insufficient)).not.toEqual(secret);
  });

  it("deduplicates identical shares gracefully", () => {
    const secret = new Uint8Array([10, 20, 30, 40]);
    const shares = splitSecret(secret, 2, 3);
    // Pass duplicate share #1 twice
    expect(combineShares([shares[0], shares[0], shares[1]])).toEqual(secret);
  });

  it("throws ThresholdError on invalid parameters", () => {
    const secret = new Uint8Array([1, 2, 3]);
    expect(() => splitSecret(secret, 4, 3)).toThrow(ThresholdError);
    expect(() => splitSecret(secret, 1, 3)).toThrow(ThresholdError);
    expect(() => combineShares([])).toThrow(ThresholdError);
  });
});

describe("WebCrypto AES-256-GCM Vault Core", () => {
  it("encrypts and decrypts secret payloads with 2-of-3 threshold", async () => {
    const secretMessage = "Confidential Token #8849-Alpha: Break-Glass Root Passphrase";
    const { ciphertext, shares } = await encryptPayload(secretMessage, 2, 3);

    expect(ciphertext).toBeDefined();
    expect(shares.length).toBe(3);

    const decrypted = await decryptPayload(ciphertext, [shares[0], shares[1]]);
    expect(decrypted).toBe(secretMessage);
  });

  it("supports Unicode, multiline text, and special characters", async () => {
    const message = `🔑 PRIMARY PRODUCTION HSM SEED\n1. abandon 2. ability 3. able\nPassphrase: 🚀🔒\nRegion: us-east-1`;
    const { ciphertext, shares } = await encryptPayload(message, 3, 5);

    const decrypted = await decryptPayload(ciphertext, [shares[1], shares[2], shares[4]]);
    expect(decrypted).toBe(message);
  });

  it("encrypts and decrypts 128KB+ payloads without truncation", async () => {
    const largeMessage = "SECRET_DATA_LINE_".repeat(8000);
    const { ciphertext, shares } = await encryptPayload(largeMessage, 2, 3);

    const decrypted = await decryptPayload(ciphertext, [shares[0], shares[2]]);
    expect(decrypted).toBe(largeMessage);
  });

  it("rejects decryption with DecryptionError if share is corrupted", async () => {
    const message = "Top Secret Payload";
    const { ciphertext, shares } = await encryptPayload(message, 2, 3);

    const corrupted: SecretShare = {
      x: shares[0].x,
      y: uint8ArrayToBase64(new Uint8Array(32).fill(0xee)),
    };

    await expect(decryptPayload(ciphertext, [corrupted, shares[1]])).rejects.toThrow(
      DecryptionError
    );
  });
});
