# EverTree Solutions

EverTree Solutions is an ultra-premium quote-matching and consultation portal for insurance, home improvement, debt relief, legal help, Medicare, and airline travel services. It combines the complete SmartBuyer operational architecture with the high-contrast, organic luxury brand identity from `theme-reference/Main.dc.html`.

---

## Brand & Design System

- **Brand Aesthetic**: EverTree Luxury Palette
  - **Forest Teal**: `#03363A` (Primary Canvas & Dominant Corporate Brand)
  - **Deep Emerald**: `#0B6B5C` (Accent Accents & Trust Anchors)
  - **Golden Amber**: `#E8B84A` / `#D4A038` (High-Conversion CTAs & Badges)
  - **Soft Mint**: `#E8F2EE` / `#F6F9F7` (High-Contrast Backgrounds & Cards)
  - **Warm Charcoal**: `#12302F` (Deep Contrast Accents)
- **Typography**: `Manrope` (Display & Headings) + `Inter` / `Outfit` (High-Legibility Body)
- **Visuals**: Ambient mesh backdrops, glassmorphism (`backdrop-filter: blur(20px)`), floating cards, micro-interactions, and official corporate logo (`logo.JPEG`).

---

## Features & Workflows

1. **Enterprise Header & Navigation**:
   - Floating glassmorphic bar with framed logo, interactive nav pills, and high-visibility phone CTA.
   - Mobile responsive drawer menu with backdrop blur.
2. **Hero & Instant Consultation**:
   - High-impact headline: *"Leads that grow with you."*
   - Embedded 4-field Consultation Card (`#start`) with direct qualification routing.
   - Proof Bar with Fortune 500 enterprise trust indicators.
3. **Core Services (All 7 Verticals)**:
   - Health Insurance, Home Improvement, Auto & Home Insurance, Debt Relief, Legal Help, Medicare, and Flight Booking.
   - Category View & Sub-Vertical landing views with full questionnaire flows.
4. **Interactive Multi-Step Quote Engine**:
   - Step 1: Visual category & sub-service cards with dynamic qualification queries.
   - Step 2: Contact verification with full TCPA consent, SSL badge, and TrustedForm token capture.
   - Step 3: Verified instant confirmation view with lead reference number.
5. **Specialist VIP Contact Window (ContactRedirectModal)**:
   - Auto-countdown dialer with live pause/resume, high-contrast gold phone display, and direct one-click calling.
6. **Executive Operations Suite (Admin Panel)**:
   - Route: `/#admin` (or `/admin`).
   - Credentials: Username: `admin` | Password: `EverTreeDemo!2026`
   - Executive KPI cards, real-time lead table with search, status filtering, service filtering, bulk status updates, bulk deletions, CSV export, staff user management, phone contact routing config, and one-click JSON database backup/restore.
7. **Flight Booking Desk**:
   - Comprehensive round-trip / one-way flight reservation desk with origin, destination, and passenger dispatch.
8. **High-Performance Technical SEO**:
   - Schema.org JSON-LD structured data (`Organization`, `WebSite`, `AggregateRating`, `FAQPage`).
   - OpenGraph & Twitter Cards.
   - Pre-configured `robots.txt` and `sitemap.xml`.

---

## Cloud Database & Persistence

- **Live Database**: Turso Cloud Database (`libsql://evertree-eshu1412.aws-ap-south-1.turso.io`) via HTTP REST / libSQL protocol.
- **Failover**: Automatic SQLite fallback (`backend/evertree.db`) if cloud credentials are unset.
- **Environment**: Configured via `.env` and `backend/.env`.

---

## Compliance & Marketing Integrations

- **ActiveProspect TrustedForm (ACTIVE)**:
  - Configured with API key `82ee82d4bb767148ccb8741c713b8998` in `.env` and `backend/.env`.
  - Frontend automatically initializes `trustedform.js` (`VITE_TRUSTEDFORM_ENABLED=true`) to generate certificates for all forms (`xxTrustedFormCertUrl`).
  - Server automatically retains certificates via ActiveProspect Retain API v4.0 with basic authentication and lead matching (`email` & `phone`).
  - Admin inspection status available at `/api/admin/trustedform/status`.
- **Meta Pixel**:
  - Fully instrumented in `frontend/src/integrations/tracking.js` for PageView, Lead, ViewContent, and Contact events.
  - Activates when `VITE_META_PIXEL_ID` is set in `.env`.

---

## Quick Start / Local Run

### 1. Backend Server (FastAPI + Turso Cloud)
```bash
# From the project root, in one terminal
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Development Server (Vite + React)
```bash
# In a second terminal
cd frontend
npm install
npm run dev
```

### 3. Production Build
```bash
cd frontend
npm run build
```
The compiled static assets are generated in `frontend/dist/` and automatically served by FastAPI when visited at `http://127.0.0.1:8000/`.
