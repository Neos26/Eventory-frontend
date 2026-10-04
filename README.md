# Eventory Frontend

React frontend for **Eventory**, an Event Resource Management System.

- Frontend repo: `Neos26/Eventory-frontend` (this repo)
- Backend repo: `Neos26/Eventory-backend`

## Tech Stack

- **Framework:** React 19
- **Build tool:** Vite 6
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Routing:** React Router 7
- **HTTP:** Axios

## Project Structure

```
src/
├── api/          # Axios instance + per-domain API modules
├── components/   # Reusable UI (Table, PageHeader, Card, forms, badges, ...)
├── context/      # Auth context (current user, token)
├── layouts/      # ManagementLayout & BookerLayout - sidebar + topbar shells
├── pages/        # One file per route (booker/ for the booker area)
├── hooks/        # Small shared hooks (useDocumentTitle)
├── schemas/      # Form/API validation schemas
├── types/        # Shared TypeScript domain types
└── utils/        # Formatting helpers
```

## Getting Started

### Prerequisites

- Node.js 18+ (developed on Node 24)

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

| Variable       | Default                     | Purpose                    |
| -------------- | --------------------------- | -------------------------- |
| `VITE_API_URL` | `http://localhost:5000/api` | Base URL of the backend API |

### 3. Run the app

```bash
npm run dev        # dev server on http://localhost:5173
npm run typecheck  # TypeScript checks only
npm run build      # typecheck + production build to dist/
```

The backend runs separately in `backend/server` (`npm run dev`).

## Routes

**Public:** `/` (home), `/login`, `/register`

**Booker area** (`/booker/...`, booker role only):

| Path | Page |
| ---- | ---- |
| `/booker/dashboard` | Booker dashboard |
| `/booker/events` | My events |
| `/booker/events/create` | Create event |
| `/booker/events/:id` | Event details |
| `/booker/events/:id/edit` | Edit event |
| `/booker/events/:id/requirements` | Event requirements |
| `/booker/bookings` | My bookings |

**Management area** (`/management/...`, management role only):

| Path | Page |
| ---- | ---- |
| `/management/dashboard` | Dashboard |
| `/management/bookings` | Booking requests |
| `/management/bookings/:id` | Booking review |
| `/management/events` | Events |
| `/management/events/create` | Create event |
| `/management/events/:id` | Event details |
| `/management/events/:id/edit` | Edit event |
| `/management/events/:id/requirements` | Event requirements |
| `/management/events/:id/readiness` | Event readiness |
| `/management/events/:id/conflicts` | Event conflicts |
| `/management/resources` | Resources |
| `/management/resources/:id` | Resource details |
| `/management/reservations` | Reservations |
| `/management/conflicts` | Conflicts |
| `/management/organizations` | Organizations |
| `/management/venues` | Venues |
| `/management/analytics` | Analytics |

Legacy short paths (`/dashboard`, `/events`, `/resources`, ...) redirect into
`/management/...`. Unknown routes render the 404 page.

## Design Notes

- **Responsive:** fixed sidebar on desktop (`lg` and up), slide-in drawer with
  backdrop on tablet/mobile; lists switch from tables to cards on small screens.
- **Theme:** OpenAI-neutral warm neutrals with a single signal-green brand
  accent, defined once in `src/index.css` via Tailwind's `@theme`.
- **Role-based:** `RequireAuth` gates the booker and management areas, each
  with its own layout shell.
- **Reusable:** page headers, paginated tables/lists, cards, badges, filters
  and forms are shared components — pages stay short and consistent.
