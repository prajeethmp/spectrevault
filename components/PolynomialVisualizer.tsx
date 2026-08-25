"use client";

import React from "react";
import { KeyRound, ShieldAlert, Sparkles } from "lucide-react";

interface PolynomialVisualizerProps {
  threshold: number;
  totalShares: number;
  activeSharesCount?: number;
}

export const PolynomialVisualizer: React.FC<PolynomialVisualizerProps> = ({
  threshold,
  totalShares,
  activeSharesCount = 0,
}) => {
  const width = 600;
  const height = 170;
  const padding = 35;

  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const secretY = 0.72;
  const sharesPoints = Array.from({ length: totalShares }, (_, i) => {
    const xNorm = (i + 1) / (totalShares + 0.5);
    const yNorm = Math.min(
      0.88,
      Math.max(0.12, secretY - 0.42 * xNorm + 0.28 * Math.sin(xNorm * Math.PI * 1.5))
    );
    return {
      shareIndex: i + 1,
      x: padding + xNorm * plotWidth,
      y: height - padding - yNorm * plotHeight,
      collected: i < activeSharesCount,
    };
  });

  const secretPoint = {
    x: padding,
    y: height - padding - secretY * plotHeight,
  };

  const curvePoints = [secretPoint, ...sharesPoints];
  let dPath = `M ${secretPoint.x} ${secretPoint.y}`;
  for (let i = 1; i < curvePoints.length; i++) {
    const prev = curvePoints[i - 1];
    const curr = curvePoints[i];
    dPath += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${curr.x} ${curr.y}`;
  }

  const isThresholdMet = activeSharesCount >= threshold;

  return (
    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            GF(2⁸) Shamir Threshold Geometry
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
            Polynomial Degree: <strong className="text-cyan-300">k - 1 = {threshold - 1}</strong>
          </span>
          <span
            className={`px-2 py-0.5 rounded border ${
              isThresholdMet
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                : "bg-slate-900 border-slate-700 text-amber-300"
            }`}
          >
            Quorum: {activeSharesCount} / {threshold}
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg bg-slate-950 border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minHeight: "130px" }}
        >
          <defs>
            <linearGradient id="polyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Axes */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#334155"
            strokeWidth="1.5"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#334155"
            strokeWidth="1.5"
          />

          <text x={padding - 6} y={padding + 5} fill="#64748b" fontSize="10" textAnchor="end">
            GF(2⁸) Space
          </text>
          <text
            x={width - padding}
            y={height - padding + 15}
            fill="#64748b"
            fontSize="10"
            textAnchor="end"
          >
            Custodians (x₁...xₙ)
          </text>

          {/* Polynomial Curve */}
          <path
            d={dPath}
            fill="none"
            stroke="url(#polyGrad)"
            strokeWidth="2"
            strokeDasharray={isThresholdMet ? "none" : "5 3"}
            className="transition-all duration-300"
          />

          {/* Secret intercept f(0) */}
          <circle
            cx={secretPoint.x}
            cy={secretPoint.y}
            r="5.5"
            fill={isThresholdMet ? "#10b981" : "#f59e0b"}
            stroke="#05070d"
            strokeWidth="2"
          />
          <text
            x={secretPoint.x + 10}
            y={secretPoint.y - 6}
            fill={isThresholdMet ? "#34d399" : "#fbbf24"}
            fontSize="10"
            fontWeight="bold"
          >
            f(0) = Master Key {isThresholdMet ? "🔓" : "🔒"}
          </text>

          {/* Custodian points */}
          {sharesPoints.map((pt) => (
            <g key={pt.shareIndex}>
              <line
                x1={pt.x}
                y1={pt.y}
                x2={pt.x}
                y2={height - padding}
                stroke={pt.collected ? "rgba(56, 189, 248, 0.4)" : "rgba(100, 116, 139, 0.2)"}
                strokeDasharray="2 2"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={pt.collected ? 5.5 : 4}
                fill={pt.collected ? "#38bdf8" : "#1e293b"}
                stroke={pt.collected ? "#06b6d4" : "#475569"}
                strokeWidth="1.5"
              />
              <text
                x={pt.x}
                y={height - padding + 14}
                fill={pt.collected ? "#38bdf8" : "#64748b"}
                fontSize="9"
                textAnchor="middle"
              >
                x={pt.shareIndex}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <KeyRound className="w-3 h-3 text-cyan-400" />
          <span>
            Lagrange Basis: <code className="text-slate-200">L_j(0) = ∏ x_m / (x_j ⊕ x_m)</code>
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <ShieldAlert className="w-3 h-3 text-slate-500" />
          <span>k - 1 shares leak 0 bits</span>
        </div>
      </div>
    </div>
  );
};
