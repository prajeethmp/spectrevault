"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Copy, ShieldCheck, Eye, EyeOff, Flame, Download } from "lucide-react";

interface SecureCanvasProps {
  content: string;
  onBurn?: () => void;
}

export const SecureCanvas: React.FC<SecureCanvasProps> = ({ content, onBurn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [watermarkDensity, setWatermarkDensity] = useState<"subtle" | "high">("subtle");

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const rawLines = content.split("\n");

    const maxCharsPerLine = 75;
    const formattedLines: { text: string; lineNum?: number }[] = [];

    rawLines.forEach((line, idx) => {
      if (line.length === 0) {
        formattedLines.push({ text: "", lineNum: idx + 1 });
      } else {
        let remaining = line;
        let isFirst = true;
        while (remaining.length > 0) {
          const chunk = remaining.slice(0, maxCharsPerLine);
          remaining = remaining.slice(maxCharsPerLine);
          formattedLines.push({
            text: chunk,
            lineNum: isFirst ? idx + 1 : undefined,
          });
          isFirst = false;
        }
      }
    });

    const lineHeight = 24;
    const paddingX = showLineNumbers ? 60 : 28;
    const paddingY = 36;
    const contentHeight = Math.max(240, (formattedLines.length + 3) * lineHeight + paddingY);
    const canvasWidth = 860;

    canvas.width = canvasWidth * dpr;
    canvas.height = contentHeight * dpr;
    ctx.scale(dpr, dpr);

    // Canvas background
    ctx.fillStyle = "#070b14";
    ctx.fillRect(0, 0, canvasWidth, contentHeight);

    // Subtle background grid
    ctx.strokeStyle = "rgba(14, 165, 233, 0.035)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvasWidth; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, contentHeight);
      ctx.stroke();
    }
    for (let y = 0; y < contentHeight; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Dynamic anti-screen forensic watermark
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle =
      watermarkDensity === "high"
        ? "rgba(255, 255, 255, 0.07)"
        : "rgba(255, 255, 255, 0.03)";
    const stamp = `RESTRICTED SESSION • ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`;

    ctx.save();
    ctx.rotate((-12 * Math.PI) / 180);
    for (let y = -200; y < contentHeight + 400; y += 45) {
      for (let x = -200; x < canvasWidth + 400; x += 260) {
        ctx.fillText(stamp, x, y);
      }
    }
    ctx.restore();

    // Line number column
    if (showLineNumbers) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
      ctx.fillRect(0, 0, 48, contentHeight);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
      ctx.beginPath();
      ctx.moveTo(48, 0);
      ctx.lineTo(48, contentHeight);
      ctx.stroke();
    }

    // Plaintext content rendering
    formattedLines.forEach((item, index) => {
      const y = paddingY + index * lineHeight;

      if (showLineNumbers && item.lineNum !== undefined) {
        ctx.font = "12px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "right";
        ctx.fillText(item.lineNum.toString(), 40, y);
      }

      ctx.font = "14px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#38bdf8";
      ctx.textAlign = "left";
      ctx.fillText(item.text, paddingX, y);
    });

    // Viewport header badge
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.beginPath();
    ctx.roundRect(paddingX, 10, 210, 18, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#34d399";
    ctx.fillText("● DOM-ISOLATED CANVAS VIEWPORT", paddingX + 8, 22);
  }, [content, showLineNumbers, watermarkDensity]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spectrevault-decrypted-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
        <div className="flex items-center gap-2 text-cyan-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Anti-Exfiltration Viewport</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`px-2.5 py-1 rounded border transition ${
              showLineNumbers
                ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            Lines: {showLineNumbers ? "ON" : "OFF"}
          </button>

          <button
            onClick={() =>
              setWatermarkDensity(watermarkDensity === "subtle" ? "high" : "subtle")
            }
            className={`px-2.5 py-1 rounded border transition ${
              watermarkDensity === "high"
                ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            Watermark: {watermarkDensity.toUpperCase()}
          </button>

          <button
            onClick={() => setShowRaw(!showRaw)}
            className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800 hover:border-slate-600 text-slate-300 flex items-center gap-1.5 transition"
          >
            {showRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showRaw ? "Canvas Mode" : "Raw Text"}
          </button>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 flex items-center gap-1.5 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800 hover:border-slate-600 text-slate-300 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Save
          </button>

          {onBurn && (
            <button
              onClick={onBurn}
              className="px-2.5 py-1 rounded border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 flex items-center gap-1.5 transition ml-auto"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Wipe Local Memory
            </button>
          )}
        </div>
      </div>

      {showRaw ? (
        <div className="relative p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-sm text-cyan-300 font-mono whitespace-pre-wrap selection:bg-cyan-500 selection:text-slate-950">
          {content}
        </div>
      ) : (
        <div
          onContextMenu={(e) => e.preventDefault()}
          className="relative border border-cyan-500/30 rounded-lg overflow-hidden p-1.5 bg-slate-950 select-none shadow-[0_0_20px_rgba(6,182,212,0.1)]"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-auto block rounded"
            style={{ imageRendering: "crisp-edges" }}
          />
        </div>
      )}
    </div>
  );
};
