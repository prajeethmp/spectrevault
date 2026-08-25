"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, QrCode, KeyRound, ExternalLink, ShieldCheck, X } from "lucide-react";
import QRCode from "qrcode";
import { SecretShare } from "@/lib/crypto";

interface CustodialShareCardProps {
  shareIndex: number;
  share: SecretShare;
  shareLink: string;
  vaultId: string;
  threshold: number;
  totalShares: number;
}

export const CustodialShareCard: React.FC<CustodialShareCardProps> = ({
  shareIndex,
  share,
  shareLink,
  threshold,
  totalShares,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (showQr && !qrDataUrl) {
      QRCode.toDataURL(shareLink, {
        margin: 1.5,
        width: 256,
        color: {
          dark: "#05070d",
          light: "#38bdf8",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Failed to generate QR Code:", err));
    }
  }, [showQr, shareLink, qrDataUrl]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(share));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition duration-200 font-mono">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs">
            #{shareIndex}
          </div>
          <div>
            <h4 className="text-xs font-bold text-cyan-300">
              Custodian Share {shareIndex}
            </h4>
            <span className="text-[10px] text-slate-400">
              Coordinate x={share.x} • Quorum {threshold}/{totalShares}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowQr(true)}
            aria-label="Generate QR Code"
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={copyJson}
            aria-label="Copy JSON"
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition text-[11px] flex items-center gap-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{copiedJson ? "Copied" : "JSON"}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-2.5 mb-3">
        <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
          <span>Custodial Access URL:</span>
          <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
            <ShieldCheck className="w-3 h-3" /> Client-Side Hash
          </span>
        </div>
        <div className="text-xs text-slate-300 truncate font-mono select-all">
          {shareLink}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            copiedLink
              ? "bg-emerald-600 text-slate-950 border border-emerald-400"
              : "bg-cyan-600 hover:bg-cyan-500 text-slate-950 border border-cyan-400"
          }`}
        >
          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedLink ? "Link Copied" : "Copy Custodian Link"}
        </button>

        <a
          href={shareLink}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:border-slate-600 text-slate-300 hover:text-cyan-300 transition"
          aria-label="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {showQr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
              aria-label="Close QR Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-cyan-300">
                Custodian Share #{shareIndex} QR Code
              </h3>
              <p className="text-xs text-slate-400">
                Scan with a mobile camera to import this custodial key share.
              </p>
            </div>

            <div className="flex justify-center p-4 bg-slate-950 rounded-xl border border-slate-800">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Code for Share ${shareIndex}`}
                  className="w-52 h-52 rounded-lg"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-500">
                  Generating QR...
                </div>
              )}
            </div>

            <button
              onClick={() => setShowQr(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
