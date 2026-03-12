# CLAUDE.md

## Project Overview
DocPage — SaaS platform for doctors to create professional websites with online payments.
Doctors sign up, fill in details, pick a template, and get a live website with Razorpay checkout.

## Architecture
- Single HTML file: `public/index.html`
- React 18 via CDN (no build system)
- Firebase Auth (Google + Email) + Firestore for data
- Razorpay for payment collection
- Hash-based routing (#/, #/dashboard, #/dr/[slug])
- Three templates: Botanical, Clinical Modern, Warm Minimal

## Routes
- `#/` — Landing page (marketing, features, pricing)
- `#/auth` — Login / Signup
- `#/dashboard` — Doctor's dashboard (wizard, preview, payments, analytics)
- `#/dr/[slug]` — Generated doctor website (public-facing)
- `#/dr/demo` — Demo site (auto-seeded with Dr. Namratha G data)

## Firebase
- Project: `ghsl-9723c` (shared with GHSL)
- Collections: `docpages` (doctor site data), `bookings` (appointment records)

## Development
- **Serve locally:** `python3 -m http.server -d public`
- **Deploy:** Vercel auto-deploys from `main` on GitHub (hg293/docpage)

## Key Features
- 5-step wizard: Basic Info → Clinic → Services & Fees → About → Template & Publish
- 20 medical specializations, 10 service categories pre-loaded
- Razorpay payment integration (doctor enters their key)
- WhatsApp fallback if no Razorpay key
- Mobile-first responsive design
