# SpectreVault

> A modernized, threshold-ephemeral zero-knowledge secret vault inspired by PrivateBin.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-Vitest-success.svg)](lib/crypto.test.ts)

---

## Architectural Differentiators from Legacy PrivateBin

1. **Threshold Access ($k$-of-$n$ Secret Sharing):** Unlike legacy single-key hash links where a single URL exposes the entire secret, encryption keys in SpectreVault are mathematically split across $n$ custodians using Galois Field $GF(2^8)$ polynomial interpolation. No single individual can access the payload alone; a threshold of $k$ custodians must combine their shares.
2. **Atomic In-Memory Destruction:** The edge endpoint deletes ciphertexts from memory immediately upon initial retrieval, mitigating replay or secondary extraction attacks.
3. **DOM-Isolated Watermarked Viewport:** Plaintext is never mounted to the DOM tree as inspectable text nodes. Content renders directly onto an isolated HTML5 canvas backed by dynamic forensic micro-watermarks.

---

## Cryptographic Pipeline

- **Symmetric Encryption:** AES-256-GCM via WebCrypto API (`window.crypto.subtle`), hardware-accelerated and strictly client-side.
- **Key Splitting:** Shamir Secret Sharing over the Rijndael irreducible polynomial $P(x) = x^8 + x^4 + x^3 + x + 1$ ($0x11b$) with generator $\alpha = 0x03$.
- **Lagrange Interpolation:** Constant-time table lookup reconstruction evaluated at $x = 0$:
  $$S = f(0) = \sum_{j=1}^{k} y_j \prod_{m \ne j} \frac{x_m}{x_j \oplus x_m}$$
- **Edge Zero-Knowledge:** Server receives only encrypted ciphertext blobs and zero key material. Key shares are transmitted exclusively via URL fragment identifiers (`#hash`).

```
[ Client Browser ]
  │
  ├─ 1. Generate 256-bit AES Master Key + 96-bit IV
  ├─ 2. Encrypt plaintext payload via WebCrypto AES-256-GCM
  ├─ 3. Split Master Key into n shares over GF(2^8): f(x) = S ⊕ a₁x ⊕ ... ⊕ aₖ₋₁xᵏ⁻¹
  │
  ├─► POST /api/vault ──────────► [ Volatile Memory Store ]
  │   (Sends only ciphertext)        • Zero plaintext knowledge
  │                                  • Auto TTL expiration sweep
  │                                  • Atomic single-use deletion
  │
  └─► Distribute Shares ────────► Custodian 1 (x=1)
      (via URL Hash # / QR)       Custodian 2 (x=2)
                                  Custodian 3 (x=3)

[ Custodian Quorum Unlock ]
  │
  ├─ 1. Custodians combine k shares (in-browser or via offline Python CLI)
  ├─ 2. GET /api/vault?id=... (Atomic Burn triggered on server)
  ├─ 3. Evaluate Lagrange basis in GF(2^8) at x = 0 to recover 256-bit key
  ├─ 4. Decrypt AES-256-GCM ciphertext
  └─ 5. Render onto DOM-isolated HTML5 Canvas with forensic watermarking
```

---

## Key Use Cases

- **Break-Glass Root Access:** Generating emergency production credentials where any 2 of 3 on-call security engineers must collaborate to reconstruct the master key.
- **Multi-Party Key Rotation:** Distributing API tokens or signing keys across independent leads without any single person holding unescrowed access.
- **Incident Response Briefings:** Securely sharing ephemeral operational details that burn immediately upon first read.

---

## Local Setup

```bash
# Clone the repository
git clone https://github.com/your-username/spectrevault.git
cd spectrevault

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Running Tests

Run the automated Vitest cryptographic test suite:
```bash
npm run test
```

Build production bundle:
```bash
npm run build
```

---

## Air-Gapped Offline Recovery

For emergency disaster-recovery or air-gapped forensic environments, secrets can be decrypted without running the web server using the included standalone Python utility:

```bash
# Combine shares using JSON strings or files
python scripts/combine_offline.py \
  --ciphertext "<BASE64_CIPHERTEXT>" \
  --shares '{"x":1,"y":"..."}' '{"x":2,"y":"..."}'

# Or decrypt using an exported JSON bundle file
python scripts/combine_offline.py --bundle spectrevault-bundle.json
```

---

## Docker Deployment

Run with Docker Compose:
```bash
docker-compose up -d --build
```

Or build the container image directly:
```bash
docker build -t spectrevault .
docker run -p 3000:3000 spectrevault
```

---

## API Reference

### Store Encrypted Vault
```http
POST /api/vault
Content-Type: application/json

{
  "ciphertext": "<base64_payload>",
  "ttlMinutes": 60
}
```

**Response (201 Created):**
```json
{
  "id": "e4f9a018bc73891402ba814092bcf10a",
  "expiresAt": 1724584255000,
  "ttlMinutes": 60,
  "status": "sealed"
}
```

### Retrieve & Burn Vault
```http
GET /api/vault?id=e4f9a018bc73891402ba814092bcf10a
```

**Response (200 OK):**
```json
{
  "ciphertext": "<base64_payload>",
  "burned": true,
  "accessedAt": "2026-08-25T14:10:00.000Z"
}
```

*Note: Any subsequent request for the same ID returns `404 Not Found`.*

---

## Threat Model & Security Boundaries

- **Server Blindness:** The backend only receives encrypted ciphertext. Even with complete host compromise, an attacker cannot decrypt data without acquiring $k$ client shares.
- **Client Key Leakage:** Key shares are encoded exclusively in client-side URL fragments (`#hash`) and are never sent in HTTP request headers.
- **Browser Memory Limitations:** While decrypted plaintext is rendered in an offscreen canvas and isolated from standard DOM queries, memory zeroization in JavaScript is subject to V8 garbage collection behavior. For maximum security, close the browser tab after reading sensitive credentials.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
