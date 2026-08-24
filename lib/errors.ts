export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultError";
  }
}

export class ThresholdError extends VaultError {
  constructor(message: string) {
    super(message);
    this.name = "ThresholdError";
  }
}

export class CorruptedShareError extends VaultError {
  constructor(message: string = "Custodial share payload is invalid or corrupted.") {
    super(message);
    this.name = "CorruptedShareError";
  }
}

export class DecryptionError extends VaultError {
  constructor(message: string = "Decryption failed. Authentication tag mismatch or incorrect key shares.") {
    super(message);
    this.name = "DecryptionError";
  }
}

export class VaultNotFoundError extends VaultError {
  constructor(message: string = "Vault not found, expired, or burned on a prior read.") {
    super(message);
    this.name = "VaultNotFoundError";
  }
}

export class PayloadSizeError extends VaultError {
  constructor(sizeBytes: number, maxBytes: number) {
    super(`Payload size (${(sizeBytes / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed limit (${(maxBytes / 1024 / 1024).toFixed(2)} MB).`);
    this.name = "PayloadSizeError";
  }
}
