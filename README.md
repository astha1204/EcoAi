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

## API Reference

| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | `/api/catalog/classify`   | Module 1: classify a product   |
| GET    | `/api/catalog/products`   | List all classified products   |
| GET    | `/api/catalog/meta`       | Get categories & filters list  |
| POST   | `/api/proposals/generate` | Module 2: generate a proposal  |
| GET    | `/api/proposals`          | List all proposals             |
| GET    | `/api/logs`               | View AI call logs              |
| GET    | `/api/stats`              | Database statistics            |
| GET    | `/api/health`             | Health check                   |

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
