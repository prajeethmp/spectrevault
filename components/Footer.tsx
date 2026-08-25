"use client";

import React from "react";
import { Shield, Lock, Terminal } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-5 mt-16 font-mono text-xs text-slate-500">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-500" />
          <span>SpectreVault • Zero-Knowledge Multi-Party Vault</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-cyan-400" /> AES-256-GCM
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" /> GF(2⁸) Shamir
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 transition underline underline-offset-2"
          >
            Source Code (MIT)
          </a>
        </div>
      </div>
    </footer>
  );
};
