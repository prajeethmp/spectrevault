import { ThresholdError, CorruptedShareError, DecryptionError } from "./errors";

/**
 * Galois Field GF(2^8) lookup tables.
 *
 * We use the Rijndael field polynomial:
 *   P(x) = x^8 + x^4 + x^3 + x + 1  (0x11b)
 *
 * In this field, 2 is not a primitive root (order 51), but alpha = 3 (0x03 = x + 1)
 * is a primitive element that generates all 255 non-zero field elements.
 */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(() => {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = val;
    EXP[i + 255] = val;
    LOG[val] = i;

    // Multiply by alpha = 3 in GF(2^8): (val * 2) ^ val
    const doubled = (val << 1) ^ (val & 0x80 ? 0x11b : 0);
    val = doubled ^ val;
  }
  EXP[510] = EXP[0];
  EXP[511] = EXP[1];
})();

/**
 * Constant-time table lookup multiplication in GF(2^8).
 */
export function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/**
 * Table lookup division in GF(2^8).
 */
export function gfDiv(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Division by zero in GF(2^8)");
  }
  if (a === 0) return 0;
  return EXP[LOG[a] - LOG[b] + 255];
}

export interface SecretShare {
  x: number;
  y: string; // Base64-encoded byte vector
  tag?: string;
}

export interface EncryptedVaultPayload {
  ciphertext: string;
  shares: SecretShare[];
  threshold: number;
  totalShares: number;
}

/**
 * Safe Base64 encoder operating in 8KB chunks to prevent V8 argument stack overflow.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Safe Base64 decoder converting to a typed Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binary = atob(base64.trim());
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    throw new CorruptedShareError("Failed to decode Base64 string payload.");
  }
}

/**
 * Splits raw secret bytes into n shares requiring any k threshold shares to reconstruct.
 * Evaluates a random polynomial f(x) = S + a_1*x + ... + a_{k-1}*x^{k-1} for each byte in GF(2^8).
 */
export function splitSecret(secretBytes: Uint8Array, threshold: number, totalShares: number): SecretShare[] {
  if (threshold > totalShares) {
    throw new ThresholdError(`Threshold (${threshold}) cannot exceed total shares (${totalShares}).`);
  }
  if (threshold < 2) {
    throw new ThresholdError("Threshold must be at least 2 for multi-party custody.");
  }
  if (totalShares > 255) {
    throw new ThresholdError("Maximum total shares is 255 in GF(2^8).");
  }

  const shares: { x: number; y: Uint8Array }[] = Array.from({ length: totalShares }, (_, i) => ({
    x: i + 1,
    y: new Uint8Array(secretBytes.length),
  }));

  for (let byteIdx = 0; byteIdx < secretBytes.length; byteIdx++) {
    const coefficients = new Uint8Array(threshold);
    coefficients[0] = secretBytes[byteIdx];
    crypto.getRandomValues(coefficients.subarray(1));

    for (let shareIdx = 0; shareIdx < totalShares; shareIdx++) {
      const xVal = shares[shareIdx].x;
      let yVal = 0;

      for (let exp = 0; exp < threshold; exp++) {
        let term = coefficients[exp];
        for (let p = 0; p < exp; p++) {
          term = gfMul(term, xVal);
        }
        yVal ^= term;
      }
      shares[shareIdx].y[byteIdx] = yVal;
    }
  }

  return shares.map((s) => ({
    x: s.x,
    y: uint8ArrayToBase64(s.y),
  }));
}

/**
 * Reconstructs the secret from any k shares using Lagrange interpolation evaluated at x = 0:
 *   S = sum_j ( y_j * prod_{m != j} ( x_m / (x_j ^ x_m) ) )
 */
export function combineShares(shares: SecretShare[]): Uint8Array {
  if (!shares || shares.length === 0) {
    throw new ThresholdError("No shares provided for reconstruction.");
  }

  // Deduplicate shares by x coordinate
  const uniqueMap = new Map<number, SecretShare>();
  for (const s of shares) {
    if (!uniqueMap.has(s.x)) {
      uniqueMap.set(s.x, s);
    }
  }
  const uniqueShares = Array.from(uniqueMap.values());
  const k = uniqueShares.length;

  const decodedShares = uniqueShares.map((s) => ({
    x: s.x,
    y: base64ToUint8Array(s.y),
  }));

  const secretLength = decodedShares[0].y.length;
  for (let i = 1; i < k; i++) {
    if (decodedShares[i].y.length !== secretLength) {
      throw new CorruptedShareError("Mismatched share lengths detected.");
    }
  }

  const secret = new Uint8Array(secretLength);

  for (let byteIdx = 0; byteIdx < secretLength; byteIdx++) {
    let secretByte = 0;
    for (let j = 0; j < k; j++) {
      let basis = 1;
      for (let m = 0; m < k; m++) {
        if (m === j) continue;
        const num = decodedShares[m].x;
        const den = decodedShares[j].x ^ decodedShares[m].x;
        if (den === 0) {
          throw new CorruptedShareError("Duplicate share coordinates found during interpolation.");
        }
        basis = gfMul(basis, gfDiv(num, den));
      }
      secretByte ^= gfMul(decodedShares[j].y[byteIdx], basis);
    }
    secret[byteIdx] = secretByte;
  }

  return secret;
}

/**
 * Encrypts arbitrary UTF-8 plaintext with a 256-bit AES-GCM key generated in WebCrypto,
 * and splits the key into n threshold shares.
 */
export async function encryptPayload(
  plaintext: string,
  threshold: number,
  totalShares: number
): Promise<EncryptedVaultPayload> {
  const masterKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit standard GCM IV

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    masterKeyBytes as unknown as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    cryptoKey,
    encoded as unknown as BufferSource
  );

  const shares = splitSecret(masterKeyBytes, threshold, totalShares);

  const combinedPayload = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
  combinedPayload.set(iv, 0);
  combinedPayload.set(new Uint8Array(ciphertextBuffer), iv.length);

  return {
    ciphertext: uint8ArrayToBase64(combinedPayload),
    shares,
    threshold,
    totalShares,
  };
}

/**
 * Reconstructs the 256-bit AES master key from custodial shares and decrypts the payload.
 */
export async function decryptPayload(
  ciphertextB64: string,
  shares: SecretShare[]
): Promise<string> {
  if (!shares || shares.length === 0) {
    throw new ThresholdError("At least one key share must be supplied.");
  }

  const masterKeyBytes = combineShares(shares);
  const rawData = base64ToUint8Array(ciphertextB64);

  if (rawData.length < 12) {
    throw new CorruptedShareError("Ciphertext payload too short (missing 12-byte IV).");
  }

  const iv = rawData.slice(0, 12);
  const ciphertext = rawData.slice(12);

  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      masterKeyBytes as unknown as BufferSource,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      cryptoKey,
      ciphertext as unknown as BufferSource
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new DecryptionError();
  }
}
