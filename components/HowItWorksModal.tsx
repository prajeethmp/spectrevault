"use client";

import React from "react";
import { X, ShieldCheck, Binary, Flame, Eye, Lock } from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8 font-mono">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
            <Lock className="w-4 h-4" />
            <span>SPECTREVAULT SYSTEM SPECIFICATION</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Multi-Party Threshold Ephemeral Vault Architecture
          </h2>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-cyan-300 flex items-center gap-2">
              <Binary className="w-4 h-4 text-cyan-400" />
              1. Shamir Secret Sharing in GF(2⁸)
            </h4>
            <p className="text-slate-400">
              When a vault is created, a 256-bit AES master key is generated client-side. Rather than distributing the key directly, it is split into <strong className="text-slate-200">n</strong> distinct shares via polynomial evaluation <code className="text-cyan-300">f(x) = S ⊕ a₁x ⊕ ... ⊕ aₖ₋₁xᵏ⁻¹</code> over Galois Field GF(2⁸) using Rijndael&apos;s irreducible polynomial <code className="text-slate-200">x⁸ + x⁴ + x³ + x + 1 (0x11b)</code> with generator <code className="text-slate-200">α = 0x03</code>.
            </p>
            <p className="text-slate-400">
              Any <strong className="text-slate-200">k</strong> shares can reconstruct the master key using Lagrange interpolation at <code className="text-slate-200">x = 0</code>. Holding <strong className="text-slate-200">k - 1</strong> shares provides Shannon Perfect Secrecy (zero statistical information about the master key).
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              2. Zero-Knowledge Client Encryption
            </h4>
            <p className="text-slate-400">
              All encryption is performed locally using the WebCrypto API (AES-256-GCM with a unique 96-bit IV and 128-bit authentication tag). The server only stores the opaque ciphertext payload and has zero visibility into the master key or any threshold share.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-rose-400 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              3. Atomic Single-Use Edge Memory
            </h4>
            <p className="text-slate-400">
              The ciphertext is held strictly in volatile memory with a configured TTL. When the unlock route <code className="text-rose-300">/api/vault?id=...</code> is called, the record is atomically fetched and purged in a single memory operation. Replay requests return <code className="text-slate-200">404</code> immediately.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-amber-400 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              4. Anti-Exfiltration Canvas Viewport
            </h4>
            <p className="text-slate-400">
              Decrypted plaintext is rendered onto an isolated HTML5 Canvas with dynamic session watermarking instead of standard HTML DOM nodes. This mitigates unauthorized scraping by browser extensions or accidental copy buffers.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
        >
          Close Specification
        </button>
      </div>
    </div>
  );
};
