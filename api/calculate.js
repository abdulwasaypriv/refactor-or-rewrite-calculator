/**
 * api/calculate.js
 * Vercel Serverless Function — POST /api/calculate
 * Replaces the Express server for production deployment.
 */

const WEIGHTS = {
  cost:     0.12,
  effort:   0.15,
  timeline: 0.23,
  teamSize: 0.10,
  techDebt: 0.40,
};

const THRESHOLDS = { REWRITE: 72, HYBRID: 42 };

const REQUIRED_FIELDS = ["cost", "effort", "timeline", "teamSize", "techDebt"];

function validateInputs(body) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null) {
      errors.push(`"${field}" is required.`);
      continue;
    }
    const val = Number(body[field]);
    if (!Number.isFinite(val))       errors.push(`"${field}" must be a number.`);
    else if (val < 1 || val > 10)    errors.push(`"${field}" must be between 1 and 10.`);
    else if (!Number.isInteger(val)) errors.push(`"${field}" must be a whole number.`);
  }
  const extra = Object.keys(body).filter((k) => !REQUIRED_FIELDS.includes(k));
  if (extra.length) errors.push(`Unexpected field(s): ${extra.map((k) => `"${k}"`).join(", ")}.`);
  return errors;
}

function calculateStrategy({ cost, effort, timeline, teamSize, techDebt }) {
  const rawScore =
    cost     * WEIGHTS.cost     +
    effort   * WEIGHTS.effort   +
    timeline * WEIGHTS.timeline +
    teamSize * WEIGHTS.teamSize +
    techDebt * WEIGHTS.techDebt;

  const riskScore   = Math.round((rawScore / 10) * 100);
  const debtLabel   = techDebt  >= 7 ? "severe"      : techDebt  >= 4 ? "moderate"     : "manageable";
  const timeLabel   = timeline  >= 7 ? "compressed"  : timeline  >= 4 ? "moderate"     : "comfortable";
  const effortLabel = effort    >= 7 ? "prohibitive" : effort    >= 4 ? "significant"  : "feasible";

  let recommendation, justification;

  if (riskScore >= THRESHOLDS.REWRITE) {
    recommendation = "Rewrite";
    justification  =
      `With ${debtLabel} tech debt and a ${timeLabel} timeline, the accumulated entropy of the existing codebase will cost more to patch than to replace — every sprint spent refactoring compounds interest on a broken foundation. ` +
      `A ${effortLabel} rewrite effort is still preferable to a maintenance death spiral; invest in a clean architecture now and recapture velocity within ${Math.ceil(effort * 1.5)} iterations.`;
  } else if (riskScore >= THRESHOLDS.HYBRID) {
    recommendation = "Hybrid";
    justification  =
      `The system sits in the danger zone — ${debtLabel} debt with ${effortLabel} refactor effort signals that incremental improvement alone will plateau quickly, yet a full rewrite carries unnecessary delivery risk given the ${timeLabel} timeline. ` +
      `A strangler-fig hybrid — isolating the most toxic modules for rewrite while refactoring stable boundaries — reduces blast radius and lets the team ship value continuously throughout the transformation.`;
  } else {
    recommendation = "Refactor";
    justification  =
      `With ${debtLabel} technical debt and a ${timeLabel} timeline, targeted refactoring is the highest-leverage move — the codebase is not yet past the point of structural redemption, and a disciplined improvement cycle will restore velocity without the delivery risk of a full rewrite. ` +
      `Given the ${effortLabel} lift required, prioritize extracting the highest-coupling modules first, instrument aggressively, and gate every refactor behind a characterization test suite to prevent regression.`;
  }

  return {
    recommendation,
    riskScore,
    justification,
    meta: { weights: WEIGHTS, rawScore: +rawScore.toFixed(4), thresholds: THRESHOLDS },
  };
}

export default function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const errors = validateInputs(req.body || {});
  if (errors.length) {
    return res.status(422).json({ error: "Validation failed.", details: errors });
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
    console.error("[/api/calculate] Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
