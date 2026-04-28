/**
 * server.js
 * Rewrite vs. Refactor — Express.js API
 *
 * POST /calculate  → { recommendation, riskScore, justification, meta }
 *
 * Setup:
 *   npm install express cors helmet express-rate-limit
 *   node server.js
 */

import express        from "express";
import cors           from "cors";
import helmet         from "helmet";
import rateLimit      from "express-rate-limit";
import { calculateStrategy } from "../src/CalculatorLogic.js";

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests — please slow down." },
  })
);

// ─── Validation Helper ─────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ["cost", "effort", "timeline", "teamSize", "techDebt"];

function validateInputs(body) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null) {
      errors.push(`"${field}" is required.`);
      continue;
    }
    const val = Number(body[field]);
    if (!Number.isFinite(val)) {
      errors.push(`"${field}" must be a number.`);
    } else if (val < 1 || val > 10) {
      errors.push(`"${field}" must be between 1 and 10 (received ${val}).`);
    } else if (!Number.isInteger(val)) {
      errors.push(`"${field}" must be a whole number (received ${val}).`);
    }
  }

  const extra = Object.keys(body).filter((k) => !REQUIRED_FIELDS.includes(k));
  if (extra.length) {
    errors.push(`Unexpected field(s): ${extra.map((k) => `"${k}"`).join(", ")}.`);
  }

  return errors;
}

// ─── Routes ────────────────────────────────────────────────────────────────────

/** Health check */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

/**
 * POST /api/calculate
 * Body: { cost, effort, timeline, teamSize, techDebt }  (all integers 1–10)
 */
app.post("/api/calculate", (req, res) => {
  const errors = validateInputs(req.body);
  if (errors.length) {
    return res.status(422).json({
      error:   "Validation failed.",
      details: errors,
    });
  }

  try {
    const { cost, effort, timeline, teamSize, techDebt } = req.body;
    const result = calculateStrategy({
      cost:     Number(cost),
      effort:   Number(effort),
      timeline: Number(timeline),
      teamSize: Number(teamSize),
      techDebt: Number(techDebt),
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("[/api/calculate] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/** 404 catch-all */
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ─── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  ✦ Decision API running on http://localhost:${PORT}`);
  console.log(`  POST /api/calculate   → strategy engine`);
  console.log(`  GET  /api/health      → liveness probe\n`);
});

export default app;
