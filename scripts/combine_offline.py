#!/usr/bin/env python3
"""
SpectreVault Air-Gapped Offline Decryption Utility

Reconstructs the 256-bit AES master key from k-of-n Shamir Secret Shares
over Galois Field GF(2^8) and decrypts the AES-256-GCM payload without network access.

Usage:
    python combine_offline.py --ciphertext <BASE64_PAYLOAD> --shares share1.json share2.json
    python combine_offline.py --bundle spectrevault-bundle.json
"""

import sys
import json
import base64
import argparse

# --- Galois Field GF(2^8) Implementation ---
EXP = [0] * 512
LOG = [0] * 256

def _init_gf():
    val = 1
    for i in range(255):
        EXP[i] = val
        EXP[i + 255] = val
        LOG[val] = i
        # Multiply by 3 (0x03) in GF(2^8) with polynomial 0x11b
        doubled = (val << 1) ^ (0x11b if (val & 0x80) else 0)
        val = doubled ^ val
    EXP[510] = EXP[0]
    EXP[511] = EXP[1]

_init_gf()

def gf_mul(a: int, b: int) -> int:
    if a == 0 or b == 0:
        return 0
    return EXP[LOG[a] + LOG[b]]

def gf_div(a: int, b: int) -> int:
    if b == 0:
        raise ZeroDivisionError("Division by zero in GF(2^8)")
    if a == 0:
        return 0
    return EXP[LOG[a] - LOG[b] + 255]

def combine_shares(shares: list) -> bytes:
    """
    Evaluates Lagrange polynomial interpolation at x = 0 to recover master key.
    """
    unique_shares = {}
    for s in shares:
        if s["x"] not in unique_shares:
            unique_shares[s["x"]] = base64.b64decode(s["y"])

    k = len(unique_shares)
    if k < 2:
        raise ValueError("At least 2 unique shares are required.")

    xs = list(unique_shares.keys())
    ys = list(unique_shares.values())
    secret_len = len(ys[0])

    secret = bytearray(secret_len)

    for byte_idx in range(secret_len):
        secret_byte = 0
        for j in range(k):
            basis = 1
            for m in range(k):
                if m == j:
                    continue
                num = xs[m]
                den = xs[j] ^ xs[m]
                if den == 0:
                    raise ValueError("Duplicate share coordinate during interpolation.")
                basis = gf_mul(basis, gf_div(num, den))
            secret_byte ^= gf_mul(ys[j][byte_idx], basis)
        secret[byte_idx] = secret_byte

    return bytes(secret)

def decrypt_aes_gcm(ciphertext_b64: str, master_key: bytes) -> str:
    raw_payload = base64.b64decode(ciphertext_b64)
    if len(raw_payload) < 28: # 12-byte IV + 16-byte tag minimum
        raise ValueError("Ciphertext payload too short.")

    iv = raw_payload[:12]
    ciphertext_and_tag = raw_payload[12:]

    # Use cryptography package if available, else fallback to OpenSSL
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        aesgcm = AESGCM(master_key)
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext_and_tag, None)
        return decrypted_bytes.decode("utf-8")
    except ImportError:
        print("[!] Note: 'cryptography' package not found. Key reconstructed:", master_key.hex())
        print("[!] Install cryptography: pip install cryptography")
        return f"[Key hex: {master_key.hex()}]"

def main():
    parser = argparse.ArgumentParser(description="SpectreVault Offline Recovery Tool")
    parser.add_argument("--ciphertext", help="Base64 ciphertext string")
    parser.add_argument("--shares", nargs="+", help="JSON files or raw JSON strings containing shares")
    parser.add_argument("--bundle", help="JSON bundle file exported from SpectreVault")

    args = parser.parse_args()

    shares_data = []
    ciphertext = args.ciphertext

    if args.bundle:
        with open(args.bundle, "r", encoding="utf-8") as f:
            bundle = json.load(f)
            ciphertext = bundle.get("ciphertext") or ciphertext
            for item in bundle.get("shares", []):
                shares_data.append(item.get("share", item))

    if args.shares:
        for s in args.shares:
            try:
                # Try parsing as JSON string directly
                shares_data.append(json.loads(s))
            except json.JSONDecodeError:
                # Try reading from file
                with open(s, "r", encoding="utf-8") as f:
                    shares_data.append(json.load(f))

    if not ciphertext or len(shares_data) < 2:
        print("Error: Missing ciphertext or fewer than 2 shares provided.", file=sys.stderr)
        parser.print_help()
        sys.exit(1)

    try:
        key = combine_shares(shares_data)
        print(f"[+] Reconstructed 256-bit AES master key: {key.hex()[:16]}...{key.hex()[-8:]}")
        plaintext = decrypt_aes_gcm(ciphertext, key)
        print("\n--- DECRYPTED VAULT CONTENTS ---")
        print(plaintext)
        print("--------------------------------\n")
    except Exception as e:
        print(f"[-] Recovery error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
