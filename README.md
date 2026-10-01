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
├── components/   # Reusable UI (Navbar, Sidebar, Card, PageHeader, ...)
├── layouts/      # MainLayout - sidebar + navbar shell around all routes
├── pages/        # One file per route
├── api/          # Shared axios instance (client.ts)
├── hooks/        # Small shared hooks (useDocumentTitle)
└── schemas/      # Form/API validation schemas
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

| Variable       | Default                      | Purpose                    |
| -------------- | ---------------------------- | -------------------------- |
| `VITE_API_URL` | `http://localhost:5000/api`  | Base URL of the backend API |

### 3. Run the app

```bash
npm run dev        # dev server on http://localhost:5173
npm run typecheck  # TypeScript checks only
npm run build      # typecheck + production build to dist/
```

The backend runs separately in `backend/server` (`npm run dev`).

## Routes

| Path | Page |
| ---- | ---- |
| `/` | Home |
| `/dashboard` | Dashboard |
| `/events` | Events |
| `/events/create` | Create Event |
| `/events/:id` | Event details |
| `/events/:id/edit` | Edit event |
| `/events/:id/requirements` | Event requirements |
| `/events/:id/readiness` | Event readiness |
| `/resources` | Resources |
| `/resources/:id` | Resource details |
| `/reservations` | Reservations |
| `/conflicts` | Conflicts |
| `/organizations` | Organizations |
| `/venues` | Venues |
| `/analytics` | Analytics |
| `*` | 404 page |

Every route renders through a shared `PagePlaceholder` component, so screens
stay consistent.

## Design Notes

- **Responsive:** fixed sidebar on desktop (`lg` and up), slide-in drawer with
  backdrop on tablet/mobile.
- **Theme:** indigo brand color + slate neutrals, defined once in `src/index.css`
  via Tailwind's `@theme`.
- **Reusable:** navigation items, page headers, cards and placeholders are
  components — pages stay short and consistent.
