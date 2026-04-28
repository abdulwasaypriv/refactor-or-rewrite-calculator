# Rewrite vs Refactor Decision Calculator

A weighted engineering decision engine with a 3D status orb.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + @react-three/fiber + Three.js
- **Backend**: Express.js + Helmet + CORS + Rate Limiting

## Quick Start

### Frontend
```bash
npm install
npm run dev
# → http://localhost:5173
```

### Backend (separate terminal)
```bash
cd server
npm install
npm start
# → http://localhost:3001
```

## Weight System
| Input     | Weight |
|-----------|--------|
| Tech Debt | 40%    |
| Timeline  | 23%    |
| Effort    | 15%    |
| Cost      | 12%    |
| Team Size | 10%    |

## Thresholds
| Score   | Decision |
|---------|----------|
| 0–41    | Refactor |
| 42–71   | Hybrid   |
| 72–100  | Rewrite  |

## API
`POST /calculate`
```json
{ "cost": 5, "effort": 7, "timeline": 8, "teamSize": 3, "techDebt": 9 }
```
