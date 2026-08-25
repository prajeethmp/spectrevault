"use client";

import React from "react";
import { Shield, Lock, Unlock, HelpCircle } from "lucide-react";

interface HeaderProps {
  mode: "create" | "unlock";
  setMode: (mode: "create" | "unlock") => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, setMode, onOpenHelp }) => {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-400 p-[1px]">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-100 font-mono">
                SPECTREVAULT
              </h1>
              <span className="px-1.5 py-0.2 text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 rounded">
                k-of-n Shamir
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Threshold Ephemeral Secret Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => setMode("create")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition ${
              mode === "create"
                ? "bg-cyan-950/70 border-cyan-500/50 text-cyan-300"
                : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Seal Secret</span>
          </button>

          <button
            onClick={() => setMode("unlock")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition ${
              mode === "unlock"
                ? "bg-cyan-950/70 border-cyan-500/50 text-cyan-300"
                : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Threshold Unlock</span>
          </button>

          <button
            onClick={onOpenHelp}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition"
            title="System Specification & Threat Model"
            aria-label="System Specification"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
