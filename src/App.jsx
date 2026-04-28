/**
 * App.jsx
 * Rewrite vs. Refactor Decision Calculator — Main UI
 * Stack: React 18 + Tailwind CSS + @react-three/fiber
 *
 * Install deps:
 *   npm install @react-three/fiber @react-three/drei three
 *   npm install -D tailwindcss
 */

import { useState, useCallback, useRef } from "react";
import ThreeScene from "./ThreeScene";
import { calculateStrategy } from "./CalculatorLogic";

// ─── Slider ────────────────────────────────────────────────────────────────────

const SLIDER_LABELS = {
  cost:     { label: "Cost",      lo: "Cheap",     hi: "Extreme"    },
  effort:   { label: "Effort",    lo: "Trivial",   hi: "Monumental" },
  timeline: { label: "Timeline",  lo: "Ample",     hi: "Critical"   },
  teamSize: { label: "Team Size", lo: "Solo",      hi: "Org-scale"  },
  techDebt: { label: "Tech Debt", lo: "Clean",     hi: "Destroyed"  },
};

function Slider({ id, value, onChange, weight }) {
  const { label, lo, hi } = SLIDER_LABELS[id];
  const pct = ((value - 1) / 9) * 100;
  const isDebt = id === "techDebt";
  const isTime = id === "timeline";
  const isHighWeight = isDebt || isTime;

  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-200 tracking-wide">
            {label}
          </span>
          {isHighWeight && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-widest">
              {isDebt ? "×0.40" : "×0.23"}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-lg font-bold tabular-nums transition-colors duration-300"
            style={{ color: `hsl(${220 - pct * 1.4}deg 80% 65%)` }}
          >
            {value}
          </span>
          <span className="text-xs text-zinc-500">/10</span>
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, hsl(${220 - pct * 1.4}deg 70% 55%), hsl(${220 - pct * 1.4}deg 90% 65%))`,
          }}
        />
      </div>

      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(id, Number(e.target.value))}
        className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer"
        style={{ top: "1.5rem" }}
        aria-label={label}
      />

      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-zinc-600 tracking-wide">{lo}</span>
        <span className="text-[10px] text-zinc-600 tracking-wide">{hi}</span>
      </div>
    </div>
  );
}

// ─── Risk Gauge ───────────────────────────────────────────────────────────────

function RiskGauge({ score }) {
  const angle = -140 + (score / 100) * 280;
  const hue   = 220 - score * 1.8;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="160" height="90" viewBox="0 0 160 90" className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#38bdf8" />
            <stop offset="50%"  stopColor="#facc15" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Track arc */}
        <path
          d="M 16 80 A 64 64 0 0 1 144 80"
          fill="none"
          stroke="#27272a"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Colored arc */}
        <path
          d="M 16 80 A 64 64 0 0 1 144 80"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="201"
          strokeDashoffset={201 - (score / 100) * 201}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}
        />

        {/* Needle */}
        <g
          transform={`rotate(${angle}, 80, 80)`}
          style={{ transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <line x1="80" y1="80" x2="80" y2="26" stroke={`hsl(${hue}deg 80% 65%)`} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="80" cy="80" r="5" fill={`hsl(${hue}deg 80% 65%)`} />
        </g>
      </svg>

      <div className="text-center -mt-4">
        <div
          className="text-4xl font-black tabular-nums transition-colors duration-500"
          style={{ color: `hsl(${hue}deg 80% 65%)` }}
        >
          {score}
        </div>
        <div className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">Risk Score</div>
      </div>
    </div>
  );
}

// ─── Recommendation Badge ─────────────────────────────────────────────────────

const BADGE_CONFIG = {
  Rewrite:  { bg: "bg-red-500/15",    border: "border-red-500/40",    text: "text-red-400",    dot: "bg-red-400"    },
  Hybrid:   { bg: "bg-amber-500/15",  border: "border-amber-500/40",  text: "text-amber-400",  dot: "bg-amber-400"  },
  Refactor: { bg: "bg-emerald-500/15",border: "border-emerald-500/40",text: "text-emerald-400",dot: "bg-emerald-400" },
};

function RecommendationBadge({ recommendation }) {
  const cfg = BADGE_CONFIG[recommendation] ?? BADGE_CONFIG.Refactor;
  return (
    <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border ${cfg.bg} ${cfg.border}`}>
      <span className={`w-2 h-2 rounded-full animate-pulse ${cfg.dot}`} />
      <span className={`text-xl font-bold tracking-wide ${cfg.text}`}>{recommendation}</span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const DEFAULT_INPUTS = { cost: 5, effort: 5, timeline: 5, teamSize: 3, techDebt: 5 };

export default function App() {
  const [inputs,    setInputs]    = useState(DEFAULT_INPUTS);
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [useApi,    setUseApi]    = useState(false); // toggle between local logic / Express API
  const resultRef = useRef(null);

  const handleChange = useCallback((id, value) => {
    setInputs((prev) => ({ ...prev, [id]: value }));
    setResult(null);
    setError(null);
  }, []);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (useApi) {
        const res = await fetch("/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        data = await res.json();
      } else {
        data = calculateStrategy(inputs);
      }
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-['DM_Sans',sans-serif] antialiased">

      {/* Noise/grid texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect x='0' y='0' width='1' height='60' fill='%23fff'/%3E%3Crect x='0' y='0' width='60' height='1' fill='%23fff'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
           style={{ background: "radial-gradient(ellipse at center, rgba(109,40,217,0.08) 0%, transparent 70%)" }} />

      <div className="relative max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-sm font-black">Δ</div>
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-[0.2em]">Engineering Decision System</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white leading-none">
            Rewrite vs Refactor
            <span className="text-violet-400">.</span>
          </h1>
          <p className="mt-3 text-zinc-500 max-w-md text-sm leading-relaxed">
            A weighted decision engine for engineering leads. Tech Debt and Timeline carry highest predictive weight.
          </p>

          {/* API Toggle */}
          <div className="flex items-center gap-3 mt-5">
            <span className="text-xs text-zinc-600">Local Logic</span>
            <button
              onClick={() => setUseApi((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${useApi ? "bg-violet-600" : "bg-zinc-700"}`}
              aria-label="Toggle API mode"
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${useApi ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-xs text-zinc-600">Express API</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── LEFT: Orb + Sliders ────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* 3D Orb card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur overflow-hidden">
              <div className="px-5 pt-5 pb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">System Health Orb</span>
                <span className="text-xs text-zinc-600">
                  Debt: <span className="text-zinc-400 font-medium">{inputs.techDebt}/10</span>
                </span>
              </div>
              <ThreeScene techDebt={inputs.techDebt} height={280} />
              <div className="px-5 pb-4 text-center">
                <p className="text-[11px] text-zinc-600 italic">
                  {inputs.techDebt <= 3
                    ? "Codebase is healthy — distortion minimal."
                    : inputs.techDebt <= 6
                    ? "Moderate entropy detected — shape destabilizing."
                    : "Critical debt mass — structure fragmenting."}
                </p>
              </div>
            </div>

            {/* Sliders */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur p-6 space-y-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Parameters</span>
                <button
                  onClick={() => { setInputs(DEFAULT_INPUTS); setResult(null); }}
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Reset
                </button>
              </div>

              {Object.keys(SLIDER_LABELS).map((id) => (
                <Slider
                  key={id}
                  id={id}
                  value={inputs[id]}
                  onChange={handleChange}
                />
              ))}

              <button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-bold text-sm tracking-wide transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <span>Calculate Strategy</span>
                    <span className="opacity-70">→</span>
                  </>
                )}
              </button>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Results ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Weight breakdown */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur p-6">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Weight Distribution</span>
              <div className="mt-4 space-y-2.5">
                {[
                  { id: "techDebt",  label: "Tech Debt",  w: 40 },
                  { id: "timeline",  label: "Timeline",   w: 23 },
                  { id: "effort",    label: "Effort",     w: 15 },
                  { id: "cost",      label: "Cost",       w: 12 },
                  { id: "teamSize",  label: "Team Size",  w: 10 },
                ].map(({ id, label, w }) => (
                  <div key={id} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-zinc-500 text-right shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${w * 2.5}%`, opacity: 0.4 + (w / 40) * 0.6 }}
                      />
                    </div>
                    <span className="w-8 text-xs text-zinc-500 tabular-nums">{w}%</span>
                    <span className="w-16 text-right text-xs font-semibold tabular-nums"
                          style={{ color: `hsl(${220 - ((inputs[id]-1)/9)*140}deg 70% 65%)` }}>
                      ={inputs[id]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results panel */}
            <div ref={resultRef} className={`rounded-2xl border bg-zinc-900/60 backdrop-blur p-6 transition-all duration-500 ${result ? "border-zinc-700 opacity-100" : "border-zinc-800/60 opacity-60"}`}>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Decision Output</span>

              {!result ? (
                <div className="mt-8 text-center">
                  <div className="text-5xl mb-3 opacity-20">⟳</div>
                  <p className="text-sm text-zinc-600">Awaiting parameter analysis…</p>
                </div>
              ) : (
                <div className="mt-5 space-y-6 animate-[fadeIn_0.4s_ease]">

                  {/* Recommendation + Gauge side by side */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-zinc-600 mb-2 uppercase tracking-widest">Recommendation</p>
                      <RecommendationBadge recommendation={result.recommendation} />
                    </div>
                    <RiskGauge score={result.riskScore} />
                  </div>

                  {/* Justification */}
                  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/40 p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Analysis</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{result.justification}</p>
                  </div>

                  {/* Meta chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] px-2 py-1 rounded bg-zinc-800 text-zinc-500 font-mono">
                      raw={result.meta?.rawScore}
                    </span>
                    <span className="text-[11px] px-2 py-1 rounded bg-zinc-800 text-zinc-500 font-mono">
                      rewrite≥{result.meta?.thresholds.REWRITE}
                    </span>
                    <span className="text-[11px] px-2 py-1 rounded bg-zinc-800 text-zinc-500 font-mono">
                      hybrid≥{result.meta?.thresholds.HYBRID}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Interpretation guide */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur p-5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Interpretation Guide</span>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Refactor",  range: "0–41",  color: "text-emerald-400", desc: "Incremental improvement. Preserve architecture." },
                  { label: "Hybrid",    range: "42–71", color: "text-amber-400",   desc: "Strangler-fig pattern. Selective module rewrite." },
                  { label: "Rewrite",   range: "72–100",color: "text-red-400",     desc: "Full replacement. Recapture velocity long-term." },
                ].map(({ label, range, color, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className={`text-sm font-bold w-18 shrink-0 ${color}`}>{label}</span>
                    <div>
                      <span className="text-[11px] font-mono text-zinc-600">{range}</span>
                      <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-zinc-800/60 flex items-center justify-between">
          <p className="text-[11px] text-zinc-700">Weighted scoring engine — Tech Debt ×0.40 · Timeline ×0.23 · Effort ×0.15 · Cost ×0.12 · Team ×0.10</p>
          <p className="text-[11px] text-zinc-700">v1.0.0</p>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input[type=range] { -webkit-appearance: none; background: transparent; }
      `}</style>
    </div>
  );
}
