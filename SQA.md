# SQA.md — Software Quality Assurance Document
## Rewrite vs. Refactor Decision Calculator

**Version:** 1.0.0
**Date:** 2026-04-28
**Project Type:** Full-Stack Web Application
**Stack:** React 18 · Vite · Tailwind CSS · Three.js · Express.js

---

## 1. Introduction

### 1.1 Purpose
This document defines the Software Quality Assurance plan for the **Rewrite vs. Refactor Decision Calculator** — a weighted engineering decision tool that analyzes five parameters (Cost, Effort, Timeline, Team Size, Tech Debt) and returns a strategic recommendation (Rewrite, Hybrid, or Refactor) along with a Risk Score and justification.

### 1.2 Scope
This SQA plan covers all four modules of the project:

| Module | File | Responsibility |
|--------|------|----------------|
| Logic Engine | `CalculatorLogic.js` | Weighted scoring, recommendation output |
| 3D Orb | `ThreeScene.jsx` | Visual health indicator (Three.js) |
| Frontend UI | `App.jsx` | Sliders, gauges, results rendering |
| Backend API | `server.js` | Input validation, Express route |

### 1.3 Definitions

| Term | Meaning |
|------|---------|
| SQA | Software Quality Assurance |
| Risk Score | Computed 0–100 value representing decision urgency |
| Weighted Score | Raw composite score derived from input × weight sums |
| Tech Debt (TD) | Accumulated shortcuts or poor design in a codebase |
| Hybrid Strategy | Strangler-fig approach — partial rewrite, partial refactor |

---

## 2. Quality Objectives

- All five inputs must be validated as integers in range [1, 10]
- Risk Score must be deterministic: identical inputs must always yield identical outputs
- The 3D orb must visually reflect Tech Debt with no rendering errors at any value
- The Express API must return structured JSON with correct HTTP status codes
- The UI must remain usable and readable at all viewport sizes ≥ 360px

---

## 3. Test Scope & Strategy

### 3.1 Testing Levels

| Level | What is Tested | Tools |
|-------|----------------|-------|
| Unit Testing | `calculateStrategy()` logic and edge cases | Jest / Vitest |
| Component Testing | Slider behavior, badge rendering, gauge output | React Testing Library |
| Integration Testing | Frontend ↔ API contract, proxy routing | Supertest + Vitest |
| Visual / Snapshot Testing | 3D Orb canvas output at debt levels 1, 5, 10 | Manual + Playwright screenshot |
| End-to-End Testing | Full user journey: set sliders → calculate → read result | Playwright |
| Regression Testing | Re-run after any logic weight or threshold change | Vitest CI |

### 3.2 Out of Scope
- Performance load testing (single-user tool, not multi-tenant)
- Accessibility audit beyond keyboard navigation
- Mobile native (web-only application)

---

## 4. Unit Tests — `CalculatorLogic.js`

### 4.1 Weight Constants Verification

```js
test('weights sum to 1.00', () => {
  const sum = 0.12 + 0.15 + 0.23 + 0.10 + 0.40;
  expect(sum).toBeCloseTo(1.00, 5);
});
```

### 4.2 Threshold Boundary Tests

| Test Case | Inputs (cost, effort, timeline, teamSize, techDebt) | Expected Recommendation | Expected Risk Score |
|-----------|------------------------------------------------------|--------------------------|----------------------|
| All minimum | (1, 1, 1, 1, 1) | Refactor | ~10 |
| All maximum | (10, 10, 10, 10, 10) | Rewrite | 100 |
| All mid | (5, 5, 5, 5, 5) | Hybrid | ~50 |
| Rewrite floor | TD=10, Timeline=10, rest=1 | Rewrite | ≥72 |
| Hybrid floor | TD=5, Timeline=5, rest=3 | Hybrid | ≥42 |
| Refactor ceiling | TD=1, Timeline=1, rest=10 | Refactor | ≤41 |
| Exact threshold 72 | Engineered to produce score=72 | Rewrite | 72 |
| Exact threshold 42 | Engineered to produce score=42 | Hybrid | 42 |

### 4.3 Input Validation Tests

```js
describe('Input validation', () => {
  test('throws RangeError for value = 0', () => {
    expect(() => calculateStrategy({ cost:0, effort:5, timeline:5, teamSize:5, techDebt:5 }))
      .toThrow(RangeError);
  });

  test('throws RangeError for value = 11', () => {
    expect(() => calculateStrategy({ cost:5, effort:11, timeline:5, teamSize:5, techDebt:5 }))
      .toThrow(RangeError);
  });

  test('throws RangeError for NaN', () => {
    expect(() => calculateStrategy({ cost:NaN, effort:5, timeline:5, teamSize:5, techDebt:5 }))
      .toThrow(RangeError);
  });

  test('throws RangeError for Infinity', () => {
    expect(() => calculateStrategy({ cost:Infinity, effort:5, timeline:5, teamSize:5, techDebt:5 }))
      .toThrow(RangeError);
  });

  test('throws for string input', () => {
    expect(() => calculateStrategy({ cost:"five", effort:5, timeline:5, teamSize:5, techDebt:5 }))
      .toThrow();
  });
});
```

### 4.4 Determinism Test

```js
test('same inputs always produce same output', () => {
  const inp = { cost:7, effort:6, timeline:8, teamSize:4, techDebt:9 };
  const r1 = calculateStrategy(inp);
  const r2 = calculateStrategy(inp);
  expect(r1.riskScore).toBe(r2.riskScore);
  expect(r1.recommendation).toBe(r2.recommendation);
});
```

### 4.5 Output Shape Test

```js
test('returns correct shape', () => {
  const r = calculateStrategy({ cost:5, effort:5, timeline:5, teamSize:5, techDebt:5 });
  expect(r).toHaveProperty('recommendation');
  expect(r).toHaveProperty('riskScore');
  expect(r).toHaveProperty('justification');
  expect(r).toHaveProperty('meta.weights');
  expect(r).toHaveProperty('meta.rawScore');
  expect(['Rewrite','Hybrid','Refactor']).toContain(r.recommendation);
  expect(r.riskScore).toBeGreaterThanOrEqual(0);
  expect(r.riskScore).toBeLessThanOrEqual(100);
  expect(typeof r.justification).toBe('string');
  expect(r.justification.length).toBeGreaterThan(50);
});
```

---

## 5. Component Tests — `App.jsx`

### 5.1 Slider Behavior

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| SL-01 | Render all 5 sliders on mount | All sliders present in DOM |
| SL-02 | Drag Tech Debt slider to 10 | `debt-display` shows "10", orb caption updates |
| SL-03 | Drag any slider | Corresponding numeric label updates immediately |
| SL-04 | Reset button click | All sliders return to defaults (cost=5, effort=5, timeline=5, teamSize=3, techDebt=5) |
| SL-05 | Weight pills visible on Timeline and Tech Debt only | `×0.23` and `×0.40` badges render; others absent |

### 5.2 Calculate Button

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| BTN-01 | Click "Calculate Strategy" | Loading spinner appears, then result renders |
| BTN-02 | Button disabled during calculation | Pointer events blocked during 420ms delay |
| BTN-03 | After result renders, change any slider | Output panel returns to empty state |

### 5.3 Result Rendering

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| RES-01 | All-min inputs → Refactor badge | Green `Refactor` badge with pulse dot |
| RES-02 | All-max inputs → Rewrite badge | Red `Rewrite` badge |
| RES-03 | Mid inputs → Hybrid badge | Amber `Hybrid` badge |
| RES-04 | Risk gauge needle angle | Angle = `-140 + (riskScore/100) * 280` degrees |
| RES-05 | Meta chips rendered | `raw=`, `rewrite≥72`, `hybrid≥42` chips visible |
| RES-06 | Justification length | Text is 2 sentences, > 100 characters |

### 5.4 API Toggle

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TOG-01 | Toggle switch to "Express API" | Subsequent calculate calls hit `/calculate` |
| TOG-02 | Toggle back to "Local Logic" | Calls revert to `calculateStrategy()` directly |

---

## 6. API Tests — `server.js`

### 6.1 Valid Request

```js
test('POST /calculate with valid body returns 200', async () => {
  const res = await request(app)
    .post('/calculate')
    .send({ cost:5, effort:5, timeline:5, teamSize:3, techDebt:7 });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('recommendation');
  expect(res.body).toHaveProperty('riskScore');
});
```

### 6.2 Validation Error Cases

| Test ID | Payload | Expected Status | Expected Field in Response |
|---------|---------|-----------------|---------------------------|
| API-01 | Missing `techDebt` | 422 | `details` array mentioning `techDebt` |
| API-02 | `cost: 0` | 422 | `details` mentions out-of-range |
| API-03 | `effort: 11` | 422 | `details` mentions out-of-range |
| API-04 | `timeline: "high"` | 422 | `details` mentions not a number |
| API-05 | Extra field `{ foo: 1 }` | 422 | `details` mentions unexpected field |
| API-06 | Empty body `{}` | 422 | All 5 fields listed in `details` |
| API-07 | Float value `{ cost: 3.5 }` | 422 | `details` mentions whole number required |

### 6.3 Health Check

```js
test('GET /health returns 200 with status ok', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
  expect(res.body).toHaveProperty('ts');
});
```

### 6.4 Rate Limiting

```js
test('exceeding 60 req/min returns 429', async () => {
  const reqs = Array.from({ length: 65 }, () =>
    request(app).post('/calculate').send({ cost:5,effort:5,timeline:5,teamSize:3,techDebt:5 })
  );
  const results = await Promise.all(reqs);
  const tooMany = results.filter(r => r.status === 429);
  expect(tooMany.length).toBeGreaterThan(0);
});
```

### 6.5 404 Route

```js
test('unknown route returns 404', async () => {
  const res = await request(app).get('/nonexistent');
  expect(res.status).toBe(404);
});
```

---

## 7. Visual / 3D Orb Tests — `ThreeScene.jsx`

Since Three.js canvas output cannot be unit tested, these are defined as manual and Playwright visual snapshot tests.

| Test ID | Condition | Expected Visual Behavior |
|---------|-----------|--------------------------|
| ORB-01 | Tech Debt = 1 | Perfect sphere, calm blue (`#38bdf8`), no distortion |
| ORB-02 | Tech Debt = 5 | Slight wobble, mid-purple color, low emissive |
| ORB-03 | Tech Debt = 10 | Heavy distortion (distort=0.75), vivid red (`#ef4444`), high emissive |
| ORB-04 | Changing TD from 1→10 | Color and distortion transition smoothly, no flicker |
| ORB-05 | Canvas resize | Orb redraws at new dimensions, no stretching |
| ORB-06 | Auto-rotate | Orb slowly rotates without stopping after 10 seconds |
| ORB-07 | Stars background | Stars visible in canvas, not obscuring the orb |

---

## 8. End-to-End Tests (Playwright)

```js
// e2e/calculator.spec.js

test('full happy path — Rewrite recommendation', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Set all sliders to maximum
  for (const slider of await page.locator('input[type=range]').all()) {
    await slider.fill('10');
  }

  await page.click('button:has-text("Calculate Strategy")');
  await page.waitForSelector('.badge-rewrite');

  const badge = page.locator('.badge-rewrite');
  await expect(badge).toBeVisible();
  await expect(badge).toContainText('Rewrite');

  const gauge = page.locator('[data-testid="risk-score"]');
  const score = parseInt(await gauge.textContent());
  expect(score).toBeGreaterThanOrEqual(72);
});

test('full happy path — Refactor recommendation', async ({ page }) => {
  await page.goto('http://localhost:5173');

  for (const slider of await page.locator('input[type=range]').all()) {
    await slider.fill('1');
  }

  await page.click('button:has-text("Calculate Strategy")');
  await page.waitForSelector('.badge-refactor');
  await expect(page.locator('.badge-refactor')).toBeVisible();
});

test('reset button restores defaults', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.locator('input[type=range]').first().fill('9');
  await page.click('button:has-text("Reset defaults")');
  const val = await page.locator('input[type=range]').first().inputValue();
  expect(val).toBe('5');
});
```

---

## 9. Regression Test Matrix

To be run after any change to weights, thresholds, or justification logic.

| Scenario | TD | TL | EF | CO | TS | Expected |
|----------|----|----|----|----|----|----------|
| Clean codebase, ample time | 1 | 1 | 2 | 3 | 2 | Refactor |
| Moderate debt, tight deadline | 5 | 8 | 5 | 4 | 3 | Hybrid |
| Legacy monolith, critical timeline | 9 | 9 | 7 | 6 | 5 | Rewrite |
| Large team, low debt | 2 | 4 | 6 | 8 | 10 | Refactor |
| Max debt, min timeline | 10 | 10 | 1 | 1 | 1 | Rewrite |
| Equal mid values | 5 | 5 | 5 | 5 | 5 | Hybrid |

---

## 10. Known Limitations & Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Three.js `MeshDistortMaterial` not available without `@react-three/drei` | High | Document dependency explicitly in README; check at install |
| CORS misconfiguration in production | Medium | Set `CLIENT_ORIGIN` env var before deploy; test with cross-origin request |
| Rate limiter uses in-memory store — resets on server restart | Low | Acceptable for single-instance tool; note in docs |
| Canvas-based orb in artifact does not use actual Three.js | Low | Artifact uses Canvas 2D simulation; production uses real Three.js |
| Float inputs (e.g., `3.7`) rejected by API | Low | By design — whole numbers only; document in API spec |

---

## 11. Continuous Integration Checklist

Before merging any PR, verify:

- [ ] `calculateStrategy()` unit tests pass (all 8 boundary cases)
- [ ] Input validation tests pass (all edge cases including NaN, Infinity, strings)
- [ ] API route tests pass (200, 422, 404, health check)
- [ ] No console errors in browser dev tools during full UI walkthrough
- [ ] Reset button restores all defaults correctly
- [ ] Toggle switch correctly routes to local logic and API
- [ ] Orb renders at Tech Debt = 1, 5, and 10 without errors
- [ ] Risk Score stays in [0, 100] for all valid input combinations

---

## 12. Approval

| Role | Name | Sign-off |
|------|------|----------|
| Developer | — | ☐ |
| QA Lead | — | ☐ |
| Tech Lead | — | ☐ |

---

*Generated for Rewrite vs. Refactor Decision Calculator v1.0.0*
