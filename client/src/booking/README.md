# MedAlerto Patient Portal — Redesign (v2)

A complete frontend overhaul of the patient booking portal: **Dashboard**
(`/book/dashboard`), **Doctors list** (`/book/doctors`) and **Doctor detail**
(`/book/doctors/:id`). Every page is self-contained and driven by realistic
mock data, so the whole flow can be previewed with no backend running.

## Quick start

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

- `/book/dashboard` — patient dashboard
- `/book/doctors` — doctor directory
- `/book/doctors/doc-abdullah` — booking flow (any doctor id works)

## Theme — derived from the repo

The visual language is pulled from the existing MedAlerto assets and portal
screens (it is **not** a new theme):

| Token | Value |
| --- | --- |
| Primary purple | `#7C3AED` |
| Deep purple | `#5B21B6` / `#4C1D95` |
| Accent indigo | `#818CF8` (`#6366F1`, `#4338CA`) |
| Accent teal | `#2DD4BF` |
| Brand gradient | `135deg #4C1D95 → #5B21B6 → #4338CA` |
| Status | amber `#F59E0B` · green `#10B981` · rose `#F43F5E` |
| Dark surfaces | `#0F172A` / `#1E293B` |
| Radius | 12px (cards) · 16px (sections) · 9999px (pills) |
| Shadow | `0 4px 24px rgba(124,58,237,0.08)` |

The official **logo assets** are used directly from `src/assets`:
`black.png` / `white.png` (theme-aware mark) via the existing `useThemedLogo`
hook, rendered by `Logo.jsx`. Dark mode follows the app's global
`[data-theme="dark"]` toggle (`dark:` utilities), so both themes are fully
supported with no extra wiring.

## File map

```
src/booking/
├── README.md              ← this file
├── theme.js               design tokens (colors, gradients, surfaces, type)
├── cn.js                  class-name joiner
├── mockData.js            realistic doctors / bookings / reviews / widgets
├── booking.css            shared utilities (glass, glow, reveal, shimmer)
├── Logo.jsx               official MedAlerto mark + portal lockup
├── Nav.jsx                sticky glass top bar + mobile drawer
├── ui.jsx                 <Button/> <Badge/> <Card/> <Avatar/> <StarRating/>
│                          <Sparkline/> <Reveal/> <Skeleton/> <EmptyState/>
├── DashboardPage.jsx      dashboard
├── DoctorsPage.jsx        doctors list + search + filters
└── DoctorDetailPage.jsx   doctor detail + payment + booking form
```

## Reconnecting to the live API

The redesign is intentionally decoupled at the data boundary:

1. `mockData.js` shapes mirror the real endpoints — `GET /public/doctors`,
   `GET /public/doctors/:id`, `GET /public/doctors/:id/reviews`,
   `GET /public/doctors/:id/slots`, `GET /patient-account/appointments`,
   `POST /patient-account/book`.
2. To go live, replace the `mockData` imports in the three pages with the
   `axios` calls already written in the original pages
   (`src/pages/booking/*`), keeping the same prop/state shapes.
3. Re-wrap `/book/dashboard` in `<PatientAccountProtectedRoute>` (see
   `src/App.jsx`) and restore the booking submit/cancel handlers.

## Accessibility & polish

- WCAG AA contrast, visible focus rings, ARIA labels, full keyboard support
  (doctor cards are keyboard-navigable), `prefers-reduced-motion` respected.
- Micro-interactions: hover lifts + purple glow, sticky filter tabs, smooth
  scroll-reveal, themed skeleton loaders, friendly empty states, copy-to-clipboard
  bank details, mobile sticky booking CTA with safe-area padding.
- Responsive-first: 1-col mobile → 2-col tablet → 3-col desktop → 1280px
  centered container on wide screens.
