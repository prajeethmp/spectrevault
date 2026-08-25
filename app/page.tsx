"use client";

import React, { useState } from "react";
import { useVault } from "@/hooks/useVault";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SecureCanvas } from "@/components/SecureCanvas";
import { CustodialShareCard } from "@/components/CustodialShareCard";
import { PolynomialVisualizer } from "@/components/PolynomialVisualizer";
import { HowItWorksModal } from "@/components/HowItWorksModal";
import {
  Lock,
  Unlock,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Download,
  Plus,
  Trash2,
  Timer,
  CheckCircle2,
  RefreshCw,
  FileCode2,
} from "lucide-react";

export default function SpectreVaultApp() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const {
    mode,
    setMode,
    secretText,
    setSecretText,
    threshold,
    setThreshold,
    totalShares,
    setTotalShares,
    ttlMinutes,
    setTtlMinutes,
    isSealing,
    sealedData,
    seal,
    inputVaultId,
    setInputVaultId,
    shareInputs,
    setShareInputs,
    parsedShares,
    isUnlocking,
    decryptedText,
    detectedShareX,
    unlock,
    resetDecrypted,
    status,
    setStatus,
  } = useVault();

  const handleDownloadBundle = () => {
    if (!sealedData) return;

    const bundle = {
      vaultId: sealedData.vaultId,
      threshold,
      totalShares,
      expiresAt: new Date(sealedData.expiresAt).toISOString(),
      ciphertext: sealedData.ciphertext,
      shares: sealedData.shares.map((s, idx) => ({
        custodianIndex: s.x,
        share: s,
        accessLink: sealedData.shareLinks[idx],
      })),
      notes: "Distribute each custodial share individually over separate communication channels.",
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spectrevault-${sealedData.vaultId.slice(0, 8)}-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadPreset = (type: "env" | "breakglass" | "audit") => {
    if (type === "env") {
      setSecretText(
        `# Production Database & Infrastructure Secrets\nDATABASE_URL="postgresql://cluster_admin:v84_Qx#8929@primary.aurora.internal:5432/main"\nREDIS_PRIMARY_AUTH="a98f71b2c4e90812"\nAWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"\nSTRIPE_RESTRICTED_KEY="rk_live_89172401874291847"`
      );
    } else if (type === "breakglass") {
      setSecretText(
        `# Break-Glass Root Infrastructure Access\nTarget: Production Kubernetes Root CA Key\nFingerprint: SHA256:7f8a91b2c3d4e5f60718293a4b5c6d7e\nMaster Token: bk_prod_root_8849102847192847\n\nAuthorization: Requires 2-of-3 on-call security quorum.`
      );
    } else {
      setSecretText(
        `# Confidential Security Incident Briefing\nIncident ID: SEC-2026-0914\nScope: Ephemeral edge containment procedure\nAction: Execute emergency rotation on token vault #404 immediately.\nAuthorization Quorum: Security Director + Infrastructure Lead`
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        mode={mode}
        setMode={(m) => {
          setMode(m);
          setStatus(null);
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {status && (
          <div
            role="status"
            className={`p-3.5 rounded-xl border text-xs font-mono flex items-start gap-2.5 shadow-md transition ${
              status.type === "success"
                ? "bg-emerald-950/70 border-emerald-500/60 text-emerald-300"
                : status.type === "error"
                ? "bg-rose-950/70 border-rose-500/60 text-rose-300"
                : status.type === "warning"
                ? "bg-amber-950/70 border-amber-500/60 text-amber-300"
                : "bg-cyan-950/70 border-cyan-500/60 text-cyan-300"
            }`}
          >
            {status.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            )}
            {status.type === "error" && (
              <Flame className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            )}
            {status.type === "warning" && (
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            )}
            {status.type === "info" && (
              <ShieldCheck className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 leading-relaxed">{status.message}</div>
          </div>
        )}

        {mode === "create" ? (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Seal Multi-Party Vault
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Presets:</span>
                  <button
                    onClick={() => loadPreset("env")}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
                  >
                    API Credentials
                  </button>
                  <button
                    onClick={() => loadPreset("breakglass")}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition"
                  >
                    Break-Glass
                  </button>
                  <button
                    onClick={() => loadPreset("audit")}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
                  >
                    Incident Note
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <textarea
                  value={secretText}
                  onChange={(e) => setSecretText(e.target.value)}
                  placeholder="Paste confidential credentials, private keys, or sensitive text..."
                  rows={7}
                  className="w-full p-4 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs sm:text-sm text-cyan-100 font-mono focus:outline-none transition resize-y"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>
                    Payload: {secretText.length} bytes | Lines:{" "}
                    {secretText ? secretText.split("\n").length : 0}
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Client-Side WebCrypto
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Quorum Threshold (k):</span>
                    <strong className="text-cyan-300 text-sm">{threshold}</strong>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={totalShares}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400">
                    Requires any {threshold} custodians to reconstruct
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Total Custodians (n):</span>
                    <strong className="text-emerald-300 text-sm">{totalShares}</strong>
                  </label>
                  <input
                    type="range"
                    min={Math.max(2, threshold)}
                    max={10}
                    value={totalShares}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setTotalShares(n);
                      if (threshold > n) setThreshold(n);
                    }}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400">
                    Generates {totalShares} unique key shares
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Expiration TTL:</span>
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                  </label>
                  <select
                    value={ttlMinutes}
                    onChange={(e) => setTtlMinutes(Number(e.target.value))}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value={5}>5 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={60}>1 Hour (Standard)</option>
                    <option value={1440}>24 Hours</option>
                    <option value={10080}>7 Days</option>
                  </select>
                  <div className="text-[10px] text-slate-400">
                    Purged from memory if unretrieved
                  </div>
                </div>
              </div>

              <PolynomialVisualizer
                threshold={threshold}
                totalShares={totalShares}
                activeSharesCount={threshold}
              />

              <button
                onClick={seal}
                disabled={isSealing || !secretText.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSealing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Encrypting & Splitting Keys...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Generate {threshold}-of-{totalShares} Threshold Vault
                    </span>
                  </>
                )}
              </button>
            </div>

            {sealedData && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl font-mono">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-emerald-300">
                        Custodial Key Shares Generated
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vault ID: <code className="text-cyan-300">{sealedData.vaultId}</code> (Burn-on-Read Active)
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadBundle}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    Download JSON Bundle
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sealedData.shares.map((share, idx) => (
                    <CustodialShareCard
                      key={idx}
                      shareIndex={idx + 1}
                      share={share}
                      shareLink={sealedData.shareLinks[idx]}
                      vaultId={sealedData.vaultId}
                      threshold={threshold}
                      totalShares={totalShares}
                    />
                  ))}
                </div>

                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Distribution Practice:</strong> Distribute each custodial link to a separate custodian via independent channels (e.g. Signal, PGP email, Matrix). Any {threshold} custodians must collaborate to unlock and burn the secret.
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Threshold Reconstruction & Burn
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Atomic Single-Use Retrieval</span>
                </div>
              </div>

              {detectedShareX !== null && (
                <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>
                      Custodian Share <strong>#{detectedShareX}</strong> detected from URL hash.
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-900 rounded border border-cyan-500/50">
                    URL Imported
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Vault Identifier:</label>
                <input
                  type="text"
                  value={inputVaultId}
                  onChange={(e) => setInputVaultId(e.target.value)}
                  placeholder="Enter 32-character Hex Vault ID (e.g. e4f9a018...)"
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs sm:text-sm text-cyan-300 focus:outline-none transition"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400">
                    Custodian Key Shares ({parsedShares.count} valid entered):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShareInputs([...shareInputs, ""])}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Slot
                  </button>
                </div>

                {shareInputs.map((shareStr, idx) => {
                  let parsedLabel = "";
                  try {
                    const p = JSON.parse(shareStr.trim());
                    if (p.x) parsedLabel = `Share #${p.x}`;
                  } catch {
                    // ignore
                  }

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={shareStr}
                          onChange={(e) => {
                            const copy = [...shareInputs];
                            copy[idx] = e.target.value;
                            setShareInputs(copy);
                          }}
                          placeholder={`Paste Custodian Share JSON #${idx + 1} (e.g. {"x":1,"y":"..."})`}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-cyan-100 font-mono focus:outline-none transition pr-24"
                        />
                        {parsedLabel && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                            {parsedLabel}
                          </span>
                        )}
                      </div>

                      {shareInputs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const copy = shareInputs.filter((_, i) => i !== idx);
                            setShareInputs(copy);
                          }}
                          className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition"
                          title="Remove Slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <PolynomialVisualizer
                threshold={Math.max(2, parsedShares.count)}
                totalShares={Math.max(3, parsedShares.count + 1)}
                activeSharesCount={parsedShares.count}
              />

              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Burn Guarantee:</strong> Requesting this vault triggers an immediate atomic purge from edge memory. It cannot be requested a second time.
                </div>
              </div>

              <button
                onClick={unlock}
                disabled={
                  isUnlocking ||
                  !inputVaultId.trim() ||
                  parsedShares.count < 2
                }
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isUnlocking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Reconstructing Key & Decrypting...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Reconstruct Master Key & Burn Vault</span>
                  </>
                )}
              </button>
            </div>

            {decryptedText && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-cyan-300">
                      Decrypted Plaintext Viewport
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-lg">
                    ● Decryption Verified
                  </span>
                </div>

                <SecureCanvas
                  content={decryptedText}
                  onBurn={resetDecrypted}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      <HowItWorksModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
