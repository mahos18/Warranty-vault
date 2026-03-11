<div align="center">

# 🛡️ WarrantyVault

### AI-powered warranty management. Scan. Track. Claim. Done.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple?style=flat-square)](https://clerk.com)
[![Groq](https://img.shields.io/badge/AI-Groq-orange?style=flat-square)](https://groq.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

## 📖 About

WarrantyVault is a full-stack, AI-powered Progressive Web App that automates the entire warranty lifecycle. From scanning invoices and tracking expiry dates to locating service centers and enabling instant technician verification via QR — all powered by a built-in AI Assistant that knows your products inside out.

> One app. Every warranty. Always protected.

---

## ✨ Features

### 🧾 Smart Invoice Scanner
- Upload invoice photos (JPG, PNG, WebP) or PDFs
- OCR pipeline via Tesseract.js extracts raw text
- Groq LLaMA 3.3 70B parses and structures warranty fields automatically
- Zero manual data entry — form autofills instantly

### 📊 Warranty Dashboard
- Real-time warranty status — Active, Expiring, Expired
- Filter by category (Electronics, Appliances, Vehicles, etc.)
- Total protected value calculator
- Days remaining countdown per product

### 🔔 Push Notifications
- Web Push API with VAPID keys
- Automated reminders at 30 days and 7 days before expiry
- Vercel Cron runs daily at 9 AM
- Works like a native app notification — no app store needed

### ⬡ SmartScan QR — Service Mode
- Generate a cryptographically secure QR code per product
- Technician scans QR → views warranty details instantly
- No login required for technician
- Token auto-expires in 1 hour for security

### 🤖 AI Warranty Assistant.
- Powered by Groq LLaMA 3.3 70B
- Reads user's actual products from the database in real-time
- Answers warranty expiry, claim steps, required documents
- Multi-turn conversation with full context memory

### 🏭 Manufacturer Support
- Manufacturer database with support phone, website, claim steps
- "Extend Warranty" CTA for eligible brands
- Required documents checklist per brand
- How-to-claim guide built into product detail page

### 📍 Nearby Service Centers
- Location-based service center discovery
- Call and Directions buttons per center
- Covers 10 major brands across Mumbai region

### 📱 Progressive Web App
- Installable on Android & iOS — no app store
- Mobile-first UI with bottom navigation
- Touch-optimized interactions throughout

---

## 🖼️ Screenshots
![Untitled design (1)](https://github.com/user-attachments/assets/c743f446-8951-4a54-9fde-560f95c4b4cc)


---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js 15 (Vercel)                │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  App     │  │  API     │  │  Cron Job          │ │
│  │  Router  │  │  Routes  │  │  (Daily 9AM)       │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
└──────────┬──────────┬──────────────────┬────────────┘
           │          │                  │
    ┌──────┴───┐ ┌────┴─────┐    ┌──────┴──────┐
    │ MongoDB  │ │ Clerk    │    │  Web Push   │
    │  Atlas   │ │  Auth    │    │  (VAPID)    │
    └──────────┘ └──────────┘    └─────────────┘
           │
    ┌──────┴───────────────────────┐
    │                              │
┌───┴──────┐  ┌──────────┐  ┌─────┴──────┐
│Cloudinary│  │  Railway │  │   Groq AI  │
│(Storage) │  │OCR Server│  │ (LLaMA 3.3)│
└──────────┘  └──────────┘  └────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Auth | Clerk |
| Database | MongoDB Atlas + Mongoose |
| AI / LLM | Groq (LLaMA 3.3 70B) |
| OCR | Tesseract.js (Railway Express Server) |
| PDF Processing | pdf-to-img |
| Storage | Cloudinary |
| Push Notifications | Web Push API + VAPID |
| QR Codes | qrcode.react |
| Deployment | Vercel (app) + Railway (OCR server) |
| Cron Jobs | Vercel Cron |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Clerk account
- Groq API key
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/warranty-vault.git
cd warranty-vault

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# MongoDB
MONGODB_URI=mongodb+srv://...

# Groq AI
GROQ_API_KEY=gsk_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# OCR Server (Railway)
OCR_SERVER_URL=https://your-railway-url.up.railway.app
OCR_SECRET=your_shared_secret

# Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=your@email.com

# Cron Security
CRON_SECRET=your_cron_secret
```

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 OCR Server (Railway)

The OCR server is a separate Express.js service deployed on Railway.

```bash
cd warranty-vault-ocr-server
npm install
npm start
```

Set these environment variables on Railway:
```env
OCR_SECRET=your_shared_secret
PORT=8080
```

---

## 📁 Project Structure

```
warranty-vault/
├── app/
│   ├── (auth)/              # Sign in / Sign up pages
│   ├── api/                 # API routes
│   │   ├── assistant/       # Groq AI assistant
│   │   ├── products/        # Product CRUD
│   │   ├── notifications/   # Push subscription
│   │   ├── service-mode/    # QR token generation
│   │   ├── service-centers/ # Nearby centers
│   │   └── cron/            # Warranty expiry checker
│   ├── dashboard/           # Main dashboard
│   ├── add-product/         # Add warranty form
│   ├── product/[id]/        # Product detail
│   ├── service/             # Service mode
│   ├── assistant/           # AI chat
│   └── profile/             # User profile
├── components/              # Reusable UI components
├── lib/
│   ├── models/              # Mongoose models
│   ├── notifications/       # Web push helpers
│   ├── automation/          # Warranty expiry checker
│   └── mongodb.ts           # DB connection
├── public/
│   └── sw.js               # Service worker
└── middleware.ts            # Clerk auth middleware
```

---

## 🔐 Security

- All API routes protected by Clerk session verification
- QR tokens are cryptographically random (UUID + 16 random bytes)
- Public warranty view never exposes `userId`
- Tokens auto-expire after 1 hour
- OCR server protected by shared secret header
- Push subscriptions are strictly user-scoped

---

## 🗺️ Roadmap

- [ ] Google Maps integration for real service center data
- [ ] Extended warranty marketplace
- [ ] Multi-user / family warranty sharing
- [ ] Bulk invoice upload
- [ ] WhatsApp notification channel
- [ ] Warranty analytics dashboard
- [ ] iOS Safari push notification support

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

## 🐉 Built by Team Celestial Dragons

*"One app. Every warranty. Always protected."*

<br/>

⭐ Star this repo if you found it useful!

</div>
