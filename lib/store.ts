export interface VaultRecord {
  ciphertext: string;
  expiresAt: number;
  createdAt: number;
}

export interface VaultStore {
  set(id: string, record: VaultRecord): Promise<void> | void;
  getAndBurn(id: string): Promise<{ record: VaultRecord | null; expired: boolean }> | { record: VaultRecord | null; expired: boolean };
  purgeExpired(): Promise<number> | number;
}

/**
 * In-Memory atomic store for single-instance edge deployment.
 */
class InMemoryVaultStore implements VaultStore {
  private map = new Map<string, VaultRecord>();

  constructor() {
    // Preserve store across dev hot-reloads
    if (process.env.NODE_ENV !== "production") {
      if (!global.__spectreVaultStore) {
        global.__spectreVaultStore = this.map;
      } else {
        this.map = global.__spectreVaultStore;
      }
    }
  }

  set(id: string, record: VaultRecord): void {
    this.map.set(id, record);
  }

  getAndBurn(id: string): { record: VaultRecord | null; expired: boolean } {
    const record = this.map.get(id);
    if (!record) {
      return { record: null, expired: false };
    }

    // Atomic burn: immediately purge from memory
    this.map.delete(id);

    if (Date.now() > record.expiresAt) {
      return { record: null, expired: true };
    }

    return { record, expired: false };
  }

  purgeExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [id, record] of this.map.entries()) {
      if (now > record.expiresAt) {
        this.map.delete(id);
        count++;
      }
    }
    return count;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __spectreVaultStore: Map<string, VaultRecord> | undefined;
  // eslint-disable-next-line no-var
  var __spectreCleanupTimer: NodeJS.Timeout | undefined;
}

export const vaultStore: VaultStore = new InMemoryVaultStore();

// Background sweep for expired vaults
if (!global.__spectreCleanupTimer) {
  global.__spectreCleanupTimer = setInterval(() => {
    vaultStore.purgeExpired();
  }, 60 * 1000);
}
