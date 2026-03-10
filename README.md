# 🌿 EcoAI Catalog System
### Module 1: AI Catalog Classifier + Module 2: B2B Proposal Generator
**Powered by Google Gemini Free API**

---

## Project Structure

```
ecoai/
├── backend/                        # Node.js + Express API
│   ├── src/
│   │   ├── config/index.js         ← ENV-based API key management
│   │   ├── services/
│   │   │   ├── geminiService.js    ← ALL AI calls isolated here
│   │   │   └── database.js         ← Data persistence layer
│   │   ├── modules/
│   │   │   ├── catalog/
│   │   │   │   └── catalogModule.js  ← Module 1 business logic
│   │   │   └── proposal/
│   │   │       └── proposalModule.js ← Module 2 business logic
│   │   ├── middleware/
│   │   │   └── errorHandler.js     ← Global error handling
│   │   ├── utils/
│   │   │   └── logger.js           ← Prompt + response logging
│   │   ├── routes/index.js         ← All API endpoints
│   │   └── index.js                ← Express server entry
│   ├── logs/                       ← Auto-created, AI call logs saved here
│   ├── .env.example                ← Copy to .env
│   └── package.json
│
└── frontend/                       # React app
    ├── src/
    │   ├── services/api.js         ← All fetch() calls in one place
    │   ├── pages/
    │   │   ├── CatalogModule.js    ← Module 1 UI
    │   │   ├── ProposalModule.js   ← Module 2 UI
    │   │   └── LogsPage.js         ← Logs & stats UI
    │   ├── App.js                  ← Tab routing
    │   ├── App.css                 ← All styles
    │   └── index.js
    ├── public/index.html
    ├── .env.example
    └── package.json
```

---

## ⚡ Setup in 5 Steps

### Step 1 — Get Your Free Gemini API Key
1. Go to **https://aistudio.google.com**
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API key"**
4. Copy the key (starts with `AIza...`)

---

### Step 2 — Set Up the Backend

```bash
# Navigate to backend folder
cd ecoai/backend

# Install dependencies
npm install

# Create your .env file from the example
cp .env.example .env
```

Now open `.env` and paste your key:
```
GEMINI_API_KEY=AIzaSy...your_key_here...
```

Start the backend:
```bash
npm run dev
```

You should see:
```
🌿 EcoAI Backend running at http://localhost:5000
📋 API Base: http://localhost:5000/api
```

Test it works:
```bash
curl http://localhost:5000/api/health
# → {"status":"ok", ...}
```

---

### Step 3 — Set Up the Frontend

Open a **new terminal**:

```bash
cd ecoai/frontend

# Install dependencies
npm install

# Create .env
cp .env.example .env
# .env already has: REACT_APP_API_URL=http://localhost:5000/api

# Start frontend
npm start
```

Browser opens at **http://localhost:3000** ✅

---

### Step 4 — Test the Modules

**Module 1 — Classify a product:**
```bash
curl -X POST http://localhost:5000/api/catalog/classify \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bamboo Kraft Paper Bag",
    "description": "100% bamboo-based kraft paper bag for retail packaging. No plastic lining, fully compostable within 90 days. Suitable for B2B bulk orders."
  }'
```

**Module 2 — Generate a proposal:**
```bash
curl -X POST http://localhost:5000/api/proposals/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "GreenMart Retail Ltd.",
    "industry": "Retail",
    "orderQty": 2000,
    "goals": "Eliminate single-use plastic by Q3 2025"
  }'
```

**View logs:**
```bash
curl http://localhost:5000/api/logs
```

---

### Step 5 — Understand the Architecture

| Technical Requirement        | Where it's implemented                          |
|------------------------------|-------------------------------------------------|
| Structured JSON outputs      | Strict schema in every Gemini prompt            |
| Prompt + response logging    | `src/utils/logger.js` → writes to `logs/` dir  |
| Env-based API key management | `src/config/index.js` reads from `.env`         |
| AI vs business logic separation | `geminiService.js` (AI) separate from modules |
| Error handling + validation  | `middleware/errorHandler.js` + Validator in each module |

---

## Troubleshooting

**"Missing required env variable: GEMINI_API_KEY"**
→ You forgot to create `.env` or the key name is wrong. Check `backend/.env`

**"API error 400" from Gemini**
→ Your API key is invalid. Re-copy it from aistudio.google.com

**Frontend shows blank / can't connect**
→ Make sure backend is running on port 5000 first

**CORS error in browser**
→ Check `FRONTEND_URL=http://localhost:3000` in backend `.env`

# 🌿 EcoAI Catalog System
### AI-Powered B2B Sustainability Platform

> Built with Node.js · React · MongoDB Atlas · Google Gemini 2.0 Flash

---

## 📦 Modules

| Module | Name | Status |
|--------|------|--------|
| Module 1 | AI Auto-Category & Tag Generator | ✅ Implemented |
| Module 2 | B2B Proposal Generator | ✅ Implemented |
| Module 3 | AI Impact Reporting Generator | 🏗️ Architecture Defined |
| Module 4 | AI WhatsApp Support Bot | 🏗️ Architecture Defined |


## 🔑 Core Design Principle

> **AI handles language. Business logic handles numbers.**

Every module follows this strict separation:

- ✅ Pricing, calculations, cost breakdowns → **pure JavaScript**
- ✅ Narratives, summaries, classifications → **Gemini AI**
- ✅ Fixed prices entered by user → **JS force-overrides AI output**

---


## 📋 Module 1 — AI Auto-Category & Tag Generator

Classifies any product into a predefined category, generates SEO tags, assigns sustainability filters, and stores the result in MongoDB.

### How it works

```
User inputs product name + description
        ↓
Backend validates input
        ↓
Gemini classifies category, sub-category, tags, filters
        ↓
JS validates output against predefined lists
        ↓
confidence < 0.65 → flagged for manual review
        ↓
Saved to MongoDB products collection
```

### Predefined Categories
`Packaging` · `Office Supplies` · `Cleaning Products` · `Food & Beverage` · `Personal Care` · `Apparel & Textiles` · `Electronics` · `Furniture & Decor` · `Agriculture & Gardening` · `Healthcare` · `Stationery` · `Industrial Supplies`

### Sustainability Filters
`plastic-free` · `compostable` · `vegan` · `recycled-content` · `biodegradable` · `zero-waste` · `carbon-neutral` · `organic-certified` · `fair-trade` · `upcycled`

### Sample Output

```json
{
  "id": "PRD-A1B2C3D4",
  "name": "Bamboo Kraft Paper Bag",
  "primary_category": "Packaging",
  "sub_category": "Retail Bags",
  "seo_tags": ["bamboo-bag", "eco-packaging", "compostable-bag", "plastic-free-packaging"],
  "sustainability_filters": ["plastic-free", "compostable", "biodegradable"],
  "confidence_score": 0.94,
  "needs_review": false,
  "created_at": "2026-03-10T10:23:00.000Z"
}
```

---

## 📋 Module 2 — B2B Proposal Generator

Generates professional B2B sustainability proposals with AI narrative + deterministic cost calculations.

### How it works

```
User fills client details + order qty + budget
        ↓
User selects products from Module 1 catalog (with optional unit price)
        ↓
Backend computes pricing tier, impact, cost breakdown (pure JS)
        ↓
Gemini generates executive summary, pain points, value proposition
        ↓
JS force-overrides any AI prices with user's fixed prices
        ↓
Final record saved to MongoDB proposals collection
```

### Pricing Tiers

| Tier | Quantity | Discount |
|------|----------|----------|
| Starter | 1 – 499 units | 0% |
| Growth | 500 – 4,999 units | 8% |
| Enterprise | 5,000+ units | 15% |

### Cost Breakdown Formula

```
Product Cost   = SUM(units × unit_price)
Packaging Cost = Product Cost × 5%
Logistics Cost = Product Cost × 3%
Total Cost     = Product Cost + Packaging + Logistics
Remaining      = Budget - Total Cost
```

### Impact Calculation

```
CO2 Saved (kg)       = total_units × 0.45
Plastic Avoided (kg) = total_units × 120g / 1000
Trees Saved          = total_units × 0.003
```

### Sample Output

```json
{
  "id": "PROP-B5C3D1E2",
  "client_name": "GreenMart Retail Ltd.",
  "pricing_tier": "Growth",
  "discount_pct": 8,
  "cost_breakdown": {
    "budget": 50000,
    "product_cost": 45000,
    "packaging_cost": 2250,
    "logistics_cost": 1350,
    "total_cost": 48600,
    "remaining_budget": 1400,
    "within_budget": true
  },
  "computed_impact": {
    "co2_saved_kg": 225,
    "plastic_avoided_kg": 60,
    "trees_saved": 1.5
  },
  "executive_summary": "AI-generated narrative...",
  "recommended_products": [...],
  "created_at": "2026-03-10T10:23:00.000Z"
}
```

---

## 🏗️ Module 3 — AI Impact Reporting Generator *(Architecture)*

Generates sustainability impact reports per order using business logic calculations + AI human-readable narrative.

### Architecture

```
Order Data (orderId, products, units, localSourcingPct)
        ↓
impactCalculator.js  ← pure JS, no AI
  - plastic_saved_kg     = units × 120g / 1000
  - carbon_avoided_kg    = units × 0.45
  - transport_saved_kg   = (localPct/100) × units × 0.08
  - trees_equivalent     = units × 0.003
        ↓
Gemini AI  ← narrative only
  - impact_statement
  - headline_stat
  - local_sourcing_summary
        ↓
Saved to MongoDB  →  impact_reports collection
```

### Files to Create

```
backend/src/modules/impact/
├── impactModule.js          Orchestrator
└── impactCalculator.js      Pure JS metric calculations

frontend/src/pages/
└── ImpactModule.js          UI
```

### Sample Stored Report

```json
{
  "id": "IMP-XXXXXXXX",
  "order_id": "PROP-ABC123",
  "client_name": "GreenMart",
  "metrics": {
    "plastic_saved_kg": 24,
    "carbon_avoided_kg": 90,
    "transport_carbon_saved_kg": 11.2,
    "trees_equivalent": 0.6,
    "local_sourcing_pct": 70
  },
  "impact_statement": "This order prevented approximately 24kg of plastic waste...",
  "headline_stat": "Equivalent to planting 0.6 trees",
  "created_at": "2026-03-10T10:23:00.000Z"
}
```

### Planned API Endpoints

```
POST  /api/impact/generate       Generate impact report for an order
GET   /api/impact                List all impact reports
GET   /api/impact/:orderId       Get report for a specific order
```

---

## 🏗️ Module 4 — AI WhatsApp Support Bot *(Architecture)*

Automated customer support via WhatsApp using Twilio + Gemini AI with real database data.

### Architecture

```
Customer WhatsApp Message
        ↓
Twilio Webhook  →  POST /api/webhook/whatsapp
        ↓
intentClassifier.js  ← pure JS keyword matching (no AI for this)
        ↓
 ┌──────────────┬──────────────┬──────────────┐
 ↓              ↓              ↓
ORDER_STATUS  FAQ/POLICY   RETURN_REFUND
 │              │              │
 DB lookup      DB policy      Escalate to
 real order     text fetch     human agent
 data           ↓              ↓
 ↓         AI Reply        "Connecting you
AI Reply                    to our team"
        ↓
Twilio sends reply back to WhatsApp
        ↓
Conversation saved to MongoDB  →  chat_logs collection
```

### Intent Detection — Pure JS

```js
// No AI token cost for intent — keyword matching is sufficient
function classifyIntent(message) {
  const msg = message.toLowerCase();
  if (msg.includes("order") && msg.includes("status")) return "ORDER_STATUS";
  if (msg.includes("return") || msg.includes("refund"))  return "RETURN_REFUND";
  if (msg.includes("cancel"))                            return "CANCELLATION";
  if (msg.includes("price") || msg.includes("quote"))   return "PRICING_QUERY";
  return "GENERAL";
}
```

### Escalation Logic — Pure JS

```js
const ESCALATE_INTENTS = ["RETURN_REFUND"];
const URGENT_WORDS     = ["urgent", "legal", "fraud", "complaint", "court"];

function shouldEscalate(intent, message) {
  if (ESCALATE_INTENTS.includes(intent)) return true;
  return URGENT_WORDS.some(w => message.toLowerCase().includes(w));
}
```

### Files to Create

```
backend/src/modules/whatsapp/
├── whatsappModule.js        Orchestrator
├── intentClassifier.js      Pure JS intent + escalation
└── responseBuilder.js       DB fetch + prompt context builder
```

### Additional Environment Variables

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Planned API Endpoints

```
POST  /api/webhook/whatsapp      Twilio webhook — receives every message
GET   /api/whatsapp/logs         All conversation logs
GET   /api/whatsapp/escalated    Escalated conversations only
```

---

## 🔁 Shared Services

All 4 modules share these — never duplicated:

| Service | File | Purpose |
|---------|------|---------|
| AI Gateway | `geminiService.js` | Single point for all Gemini API calls |
| Logger | `logger.js` | Logs every prompt + response to daily file |
| Config | `config/index.js` | Reads .env, throws on missing keys |
| Database | `database.js` | All MongoDB operations in one place |

---

## 🌐 API Reference

| Method | Endpoint | Module | Description |
|--------|----------|--------|-------------|
| GET | `/api/health` | System | Health check |
| POST | `/api/catalog/classify` | Module 1 | Classify a product |
| GET | `/api/catalog/products` | Module 1 | List all products |
| GET | `/api/catalog/meta` | Module 1 | Categories & filters list |
| POST | `/api/proposals/generate` | Module 2 | Generate a proposal |
| GET | `/api/proposals` | Module 2 | List all proposals |
| POST | `/api/impact/generate` | Module 3 | Generate impact report |
| GET | `/api/impact` | Module 3 | List all impact reports |
| GET | `/api/impact/:orderId` | Module 3 | Report by order ID |
| POST | `/api/webhook/whatsapp` | Module 4 | Twilio webhook |
| GET | `/api/whatsapp/logs` | Module 4 | Conversation logs |
| GET | `/api/whatsapp/escalated` | Module 4 | Escalated chats |
| GET | `/api/logs` | System | AI call logs |
| GET | `/api/stats` | System | DB statistics |


---

## 📁 MongoDB Collections

| Collection | Module | Description |
|------------|--------|-------------|
| `products` | Module 1 | Classified product catalog |
| `proposals` | Module 2 | B2B proposals with cost data |
| `impact_reports` | Module 3 | Sustainability metrics per order |
| `chat_logs` | Module 4 | WhatsApp conversations |

---

## 🐛 Known Issues Fixed

| Bug | Cause | Fix |
|-----|-------|-----|
| 502 Bad Gateway | `maxOutputTokens` was 1500, JSON got cut off | Increased to 8192 |
| Model not found | `gemini-1.5-flash` retired April 2025 | Use `gemini-2.0-flash` |
| Wrong prices in output | AI ignored fixed price instructions | JS force-override after AI call |
| Async not awaited | MongoDB methods are async | Added `await` to all DB calls |

---

<p align="center">
  Made with 🌱 for sustainable B2B commerce
</p>
