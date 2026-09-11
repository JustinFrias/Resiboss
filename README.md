# Resiboss 🧾✨

> **Next-Generation 3D Liquid Glass Receipt Scanner & Financial Intelligence**  
> Automated OCR, intelligent VAT computation, 3D interactive inspection, and seamless Microsoft Excel (`.xlsx`) export across Web and Native Mobile.

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.5-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Graphics-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

🌐 **Live Web Application:** [https://resiboss.vercel.app](https://resiboss.vercel.app)  
📱 **Mobile Platform:** Android APK (Capacitor 8) & Responsive Web / PWA

---

## 🌟 Overview

**Resiboss** transforms messy paper receipts and invoices into structured, auditable financial records. Built with modern web and mobile technologies, it features an immersive **3D Liquid Glassmorphism** interface, dual OCR recognition engines (Offline Local OCR & Google Gemini Vision AI), and an automated tax engine tailored for standard VAT and expense reporting.

---

## 🚀 Key Features

### 📸 Dual-Engine Receipt Scanning & OCR
- **Offline Local OCR (`Tesseract.js`):** Client-side image recognition that works completely offline with zero server dependencies.
- **Google Gemini Vision AI (`gemini-1.5-flash` / `gemini-2.0-flash`):** High-precision AI vision extraction with multi-model fallback for complex thermal receipts, crumpled paper, and noisy backgrounds.
- **Smart Financial Parser:** Automatically extracts and structures:
  - Merchant / Vendor Name
  - Transaction Date & Time
  - Tax Identification Number (TIN) / OR Number
  - 12% VAT Breakdown & Vatable Subtotal
  - Payment Method (Cash, Card, GCash, Maya, etc.)
  - Line-by-line itemized items with quantities and unit prices

### 🎮 Immersive 3D Liquid Glass UI
- **TiltCard 3D Interactivity:** Gyroscope and cursor-reactive 3D depth tilt on cards and panels.
- **3D Receipt Inspector (`ReceiptViewer3D`):** Full 360-degree interactive rotation, flip to examine back annotations, and zoom controls.
- **Dynamic Haptic Sound FX:** Synthesized audio feedback for scans, laser interactions, button clicks, and celebrations.

### 📊 Financial Dashboard & Audit Vault
- **Visual Analytics:** Real-time charts showing monthly expenses, category distribution, top vendors, and VAT deductible credits.
- **Document Audit Vault:** Search by merchant, TIN, or ID; filter by category and verification status (`Verified`, `Pending`).

### 📥 Unblockable Microsoft Excel (`.xlsx`) & CSV Export
- **Automated Excel Generation:** Creates professional, multi-sheet Excel workbooks with:
  1. *Purchases & Expenses Journal* (monthly ledger with VAT tax columns)
  2. *Itemized Breakdown* (line-by-line descriptions, quantities, and totals)
- **Zero-Wait Synchronous Trigger:** Solves mobile browser popup and download blocker issues (Chrome/Safari/WebView) by triggering downloads directly inside the active user interaction tick.
- **Android Native Save / Share Sheet:** Integrated with `@capacitor/filesystem` (Scoped Storage safe) and `@capacitor/share` for saving directly to device storage or opening in Google Sheets / Excel.
- **One-Tap Direct Download Fallback:** Interactive in-app notification button for guaranteed one-tap downloads on any restrictive browser or in-app webview.

### ☁️ Cloud Sync & Security
- **Supabase Backend:** PostgreSQL storage with Row Level Security (RLS) policies.
- **Authentication:** Google OAuth and email/password login with secure session persistence.
- **Cross-Device Continuity:** Instant data synchronization across desktop browsers, mobile web, and the native Android app.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, Vite 8 |
| **Styling & Design System** | Custom Liquid Glass CSS, Cyber Neon design tokens, Google Fonts (*Outfit*, *JetBrains Mono*, *Plus Jakarta Sans*) |
| **3D Rendering** | Three.js, Canvas Confetti |
| **Mobile Runtime** | Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/filesystem`, `@capacitor/share`, `@capacitor/browser`, `@capacitor/app`) |
| **Database & Auth** | Supabase (`@supabase/supabase-js`) |
| **OCR & AI** | Tesseract.js (Local), Google Gemini Vision API (Cloud AI) |
| **Spreadsheet Generation**| SheetJS (`xlsx`) |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
Resiboss/
├── android/                         # Capacitor Native Android project
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml      # App permissions & FileProvider
│   │   └── res/xml/file_paths.xml   # File sharing storage paths
├── public/                          # Static assets, emblems, icons
├── src/
│   ├── assets/                      # Bundled images and media
│   ├── components/                  # Reusable UI components
│   │   ├── auth/                    # Auth cards & modal forms
│   │   ├── canvas/                  # Three.js 3D background canvas
│   │   ├── layout/                  # Navbar, Sidebar, TopBar
│   │   ├── legal/                   # Terms, Privacy, Cookie modals
│   │   ├── mobile/                  # Bottom navigation bar
│   │   ├── modals/                  # ReceiptViewer3D inspector, AI config modal
│   │   └── ui/                      # TiltCard, Liquid buttons, badges
│   ├── context/
│   │   └── AppContext.jsx           # Global state (documents, auth, theme, settings)
│   ├── lib/
│   │   └── supabaseClient.js        # Supabase client initialization
│   ├── styles/                      # CSS variables, glassmorphism utilities
│   ├── utils/
│   │   ├── fileDownloader.js        # Cross-platform Excel/CSV unblockable exporter
│   │   ├── geminiOcr.js             # Google Gemini Vision AI OCR client
│   │   ├── i18n.js                  # English & Tagalog translations
│   │   ├── receiptOcrParser.js      # Financial parser (regex, TIN, VAT, items)
│   │   └── soundEffects.js          # Web Audio API sound synthesis
│   ├── views/                       # Main application views
│   │   ├── AnalyticView.jsx         # Charts & financial metrics
│   │   ├── AuthView.jsx             # Sign-in & registration
│   │   ├── DashboardView.jsx        # Overview & recent activity
│   │   ├── DocumentsView.jsx        # Vault table & card views
│   │   ├── ExportView.jsx           # Multi-receipt selection & Excel export
│   │   ├── ScannerView.jsx          # Camera capture, file upload & OCR scanner
│   │   └── SettingsView.jsx         # Profile, theme, audio, and account controls
│   ├── App.jsx                      # Route management & layout wrapper
│   ├── index.css                    # Core design system & glass styles
│   └── main.jsx                     # Application entry point
├── capacitor.config.json            # Capacitor mobile configuration
├── package.json
├── supabase_schema.sql              # Supabase database schema & RLS policies
└── vite.config.js                   # Vite build configuration
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Android Studio** (optional, only for building local Android APK)

### 1. Clone the Repository
```bash
git clone https://github.com/JustinFrias/Resiboss.git
cd Resiboss
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Google Gemini Vision API Key (can also be configured inside the app settings)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```

---

## 📱 Mobile App (Capacitor Android)

### Sync Web Assets to Android
```bash
npx cap sync android
```

### Open in Android Studio
```bash
npx cap open android
```
From Android Studio, click **Run** to launch on a connected device or emulator, or build an APK via **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 🔒 Security & Privacy

- **Row Level Security (RLS):** Users can strictly only read and write their own financial receipts in Supabase.
- **Local OCR Privacy:** Receipts scanned via Tesseract.js are processed locally in-browser/on-device without leaving the client.
- **Credential Storage:** Sensitive API keys (e.g. Gemini Vision API keys) can be stored locally in browser `localStorage` or device sandbox.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Justin Frias**  
- GitHub: [@JustinFrias](https://github.com/JustinFrias)  
- Project Repository: [Resiboss](https://github.com/JustinFrias/Resiboss)
