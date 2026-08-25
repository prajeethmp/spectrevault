# Security Policy

## Responsible Disclosure

If you discover a potential security vulnerability in SpectreVault, please report it responsibly by contacting the maintainers directly or creating a private security advisory on GitHub.

Please do not disclose vulnerabilities in public issue trackers.

Include the following in your report:
- Vector description and reproduction steps (or proof-of-concept)
- Impact assessment on key reconstruction or edge memory persistence
- Browser environment and Node.js version tested

---

## Security Model & Guarantees

1. **Zero-Knowledge Principle:** Plaintext and key material never leave the browser unencrypted. The server acts strictly as an ephemeral storage relay for ciphertext.
2. **Information-Theoretic Key Security:** Secret splitting relies on Shamir's Secret Sharing over Galois Field $GF(2^8)$. Fewer than $k$ shares reveal strictly zero information about the 256-bit AES master key.
3. **Atomic Single-Use Retrieval:** The server-side in-memory cache guarantees atomic burn-on-read. Once a record is accessed, it is deleted immediately, preventing replay or second-read extraction.
4. **DOM Isolation:** Decrypted data is drawn directly onto an HTML5 Canvas to prevent unauthorized extraction by DOM-inspecting browser extensions.
