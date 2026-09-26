# Resiboss 2.0 🧾✨

> **AI-Powered Personal Spending Intelligence Platform**  
> *Scan → Understand → Store → Analyze → Learn → Predict → Act*  
> Automated OCR, intelligent VAT computation, purchase pattern detection, item price history, smart shopping list, and natural language financial insights across Web, PWA, and Native Android.

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-Vision%20%26%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.5-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Graphics-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

🌐 **Live Web Application:** [https://resiboss.vercel.app](https://resiboss.vercel.app)  
📱 **Mobile Platform:** Android Native APK (`.apk` direct download) & Apple iOS PWA ("Add to Home Screen")

---

## 🌟 What is Resiboss 2.0?

**Resiboss 2.0** elevates receipt tracking from a passive archive into an **AI-driven personal spending intelligence platform**. Instead of simply digitizing receipts, Resiboss helps you understand your money:

* **What did I spend?** Instant mathematical breakdown of line items, VAT, and discounts.
* **What did Resiboss notice?** Proactive detection of price changes, spending spikes, and store habits.
* **What do I need to buy?** Intelligent purchase cycle predictions and automated shopping suggestions.
* **How can I ask questions?** DB-first conversational AI that gives deterministic, factual financial answers with zero hallucination.

---

## 🚀 Resiboss 2.0 Key Features

### 🧠 1. Spending Intelligence Engine (`spendingIntelligence.js`)
* **Month-over-Month Delta Analysis:** Tracks spending shifts across monthly periods in clear, neutral language.
* **Category & Store Intelligence:** Aggregates spending totals, visit frequencies, and average receipt values per vendor.
* **Item-Level Price History:** Traces unit price evolution per item across different stores and purchase dates.
* **Purchase Pattern Recognition:** Computes recurring intervals for products purchased $3+$ times, identifying typical cycles and overdue restocks.

### 🤖 2. Ask Resiboss (`AskResibossView.jsx`)
* **DB-First Architecture:** Financial computations are evaluated deterministically against stored records before passing to Google Gemini 2.0 Flash for natural language formatting.
* **Controlled Query Routing:** Supports natural questions such as:
  * *"How much did I spend this month?"*
  * *"What is my top spending category?"*
  * *"Which store do I visit the most?"*
  * *"What was my most expensive purchase?"*
* **Persistent Chat Threads:** Conversation history syncs across sessions and devices.

### 🛒 3. Smart Shopping List (`ShoppingListView.jsx`)
* **Predictive Restock Suggestions:** Automatically surfaces items due or overdue for purchase based on learned intervals.
* **One-Tap Addition:** Add suggestions straight to your active grocery checklist.
* **Interactive Checklist:** Inline editing, completion toggles, batch cleanup, and cloud synchronization.

### 📸 4. Next-Gen Receipt Scanner (`ScannerView.jsx`)
* **Dual-Engine Vision Pipeline:**
  * **Google Gemini 2.0 Flash Vision:** High-precision extraction of line items, quantities, VAT, and discounts.
  * **On-Device Fallback:** Tesseract.js and ML Kit OCR for offline capabilities.
* **Duplicate Receipt Detection:** Identifies candidate duplicate receipts before saving based on store, date, total amount, and receipt number matches.
* **Mathematical Consistency Check:** Cross-validates line item sums, VAT, and discounts against the extracted total due.
* **Extended Metadata:** Captures Branch/Location, Invoice/Reference Number, and item-by-item verification flags.

### 🗄️ 5. Enhanced Receipts Vault (`DocumentsView.jsx`)
* **Item-Level Search:** Search receipts by vendor, receipt number, date, category, or individual item name.
* **Date Range Filtering:** Quick filtering by *All Dates*, *This Month*, *Last 30 Days*, and *This Year*.
* **Interactive 3D Receipt Inspector (`ReceiptViewer3D`):** 360-degree rotation, flip controls, and texture zoom.
* **Export to Excel (`.xlsx`):** Multi-sheet financial ledgers compatible with Microsoft Excel and Google Sheets.

### 🔒 6. Security, Privacy & RLS Hardening
* **Supabase Row Level Security:** Strict `auth.uid() = user_id` isolation across all user tables.
* **Philippine DPA & GDPR Compliance:** Built-in bilingual (English & Filipino) Terms of Service and Privacy Policy modals (`TermsModal.jsx`, `PrivacyPolicyModal.jsx`).
* **Permanent Data Purge:** One-click account and receipt deletion RPC (`delete_user_account`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, Vite 8 |
| **Styling & Design System** | Vanilla CSS, Cyber Neon Glassmorphism (`liquid-glass.css`, `resiboss2.css`), Google Fonts (*Outfit*, *JetBrains Mono*, *Plus Jakarta Sans*) |
| **3D Rendering** | Three.js |
| **Database & Auth** | Supabase PostgreSQL, Supabase Realtime, Row Level Security |
| **AI & Vision** | Google Gemini 2.0 Flash Vision, Google ML Kit (Android), Tesseract.js |
| **Mobile Runtime** | Capacitor 8 (Android Native APK, iOS PWA) |
| **Export Formats** | Excel (`.xlsx`), CSV via SheetJS |
| **Icons & Audio** | Lucide React, Procedural Web Audio API Sound FX |

---

## 📁 Project Structure

```
Resiboss/
├── android/                         # Native Android Capacitor workspace
├── public/                          # Static assets, PWA icons, manifest.json
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── auth/                    # Auth cards & modal forms
│   │   ├── canvas/                  # Three.js 3D liquid background canvas
│   │   ├── layout/                  # Sidebar, TopBar, MobileBottomNav
│   │   ├── legal/                   # TermsModal, PrivacyPolicyModal, CookieConsent
│   │   ├── modals/                  # ReceiptViewer3D inspector
│   │   └── ui/                      # TiltCard, InAppToast, badges
│   ├── config/                      # Feature flags & settings
│   ├── context/
│   │   └── AppContext.jsx           # Unified application state & Supabase data store
│   ├── lib/
│   │   └── supabase.js              # Supabase client, queries, and CRUD helpers
│   ├── styles/
│   │   ├── index.css                # Global design system
│   │   ├── liquid-glass.css         # Glassmorphism aesthetic tokens
│   │   └── resiboss2.css            # Resiboss 2.0 layout & component styles
│   ├── utils/
│   │   ├── fileDownloader.js        # Excel (.xlsx) / CSV generator
│   │   ├── geminiOcr.js             # Gemini 2.0 Flash Vision client
│   │   ├── receiptOcrParser.js      # Text normalization & financial auditing
│   │   ├── soundEffects.js          # Web Audio API sound synthesizer
│   │   └── spendingIntelligence.js  # Resiboss 2.0 intelligence & pattern engine
│   ├── views/                       # Resiboss 2.0 views
│   │   ├── AnalyticView.jsx         # Historical financial charts
│   │   ├── AskResibossView.jsx      # Conversational AI spending assistant
│   │   ├── AuthView.jsx             # Login & Registration screen
│   │   ├── DashboardView.jsx        # Resiboss 2.0 overview & daily spend
│   │   ├── DocumentsView.jsx        # Receipt Vault with item-level search
│   │   ├── ExportView.jsx           # Excel ledger export manager
│   │   ├── InsightsView.jsx         # Spending trends, MoM delta & price tracking
│   │   ├── ScannerView.jsx          # Camera / upload OCR scanner with duplicate check
│   │   ├── SettingsView.jsx         # User profile, thresholds, and audio settings
│   │   └── ShoppingListView.jsx     # Smart shopping list with AI suggestions
│   ├── App.jsx                      # Shell & tab routing
│   └── main.jsx                     # Entry point
├── supabase/                        # Database migrations & edge functions
│   ├── functions/                   # Supabase edge functions
│   └── migrations/                  # Versioned schema migrations
├── supabase_migrations_v2.sql       # Resiboss 2.0 database upgrade script
├── capacitor.config.json            # Capacitor mobile configuration
├── package.json
└── vite.config.js                   # Vite configuration (port 3000)
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Supabase Account** (free tier supported)
- **Google Gemini API Key** (optional for cloud AI OCR)

### 1. Clone & Install
```bash
git clone https://github.com/JustinFrias/Resiboss.git
cd Resiboss
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Google Gemini Vision API Key (can also be entered directly in app settings)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```

---

## 🗄️ Database Setup (Supabase)

1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Open [`supabase_migrations_v2.sql`](supabase_migrations_v2.sql) (or run the versioned script in `supabase/migrations/`).
4. Click **Run** to provision the hardened RLS policies, new columns (`branch`, `receipt_number`, `discount`, `notes`), and support tables (`shopping_list_items`, `ai_conversations`).

---

## 📱 Mobile Distribution (Android Native)

### Sync Web Assets to Android
```bash
npx cap sync android
```

### Open in Android Studio
```bash
npx cap open android
```
Build an APK via **Build > Build Bundle(s) / APK(s) > Build APK(s)** or click **Run** to debug on a connected device.

---

## 🔒 Security & Privacy

* **Zero Public Access:** Anonymous access to receipts is revoked; all queries enforce Row Level Security (`auth.uid()::text = user_id`).
* **Non-Hallucinating AI:** The AI layer never fabricates transaction values. Spending answers are calculated directly from user data before natural language rendering.
* **Local Processing Options:** On-device OCR (ML Kit & Tesseract.js) enables receipt reading without sending image data over the network.
* **Right to Be Forgotten:** Complete account deletion function cascades through receipts, shopping items, AI conversations, and auth identities.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Justin Frias**  
- GitHub: [@JustinFrias](https://github.com/JustinFrias)  
- Project Repository: [Resiboss](https://github.com/JustinFrias/Resiboss)
