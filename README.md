# Convene

A full-stack event management platform for clubs and organizations to publish
events, manage registrations and teams, track attendance, sell merchandise,
and run post-event feedback — with dedicated experiences for participants,
event organizers, and admins.

## Features

- **Multi-actor auth** — separate login flows and JWT-based sessions for
  participants, organizers, and admins (no admin self-registration; the only
  admin account is bootstrapped from environment variables at boot).
- **Self-service password reset** — a standard emailed, single-use, expiring
  reset link for participants and organizers alike.
- **Event lifecycle** — draft → published → ongoing → closed, with a
  "publish immediately" option so organizers aren't forced through a separate
  create-then-publish round trip.
- **QR ticketing & attendance** — a QR ticket is issued on registration;
  organizers scan (camera or manual entry) at the door, with CSV export of
  both registrants and attendance.
- **Team registration & chat** — invite-code (or shareable-link) team
  formation, plus realtime Socket.io chat once a team is complete.
- **Merchandise** — purchase with payment-proof upload, organizer
  approve/reject, automatic stock deduction, and an optional
  auto-approve mode for events that don't need manual review.
- **In-app notifications** — a live notification center (registration
  confirmations, payment decisions, new events from clubs you follow),
  pushed over the same Socket.io connection used for chat.
- **Organizer analytics** — registration trends, category breakdown, and
  top-events charts across all of an organizer's events.
- **Discussion forum & feedback** — per-event discussion threads with
  organizer moderation, and post-event star ratings with aggregate stats.
- **Organizer discovery** — participants browse and follow clubs; followed
  clubs' new events surface as recommendations and notifications.

See [`docs/API.md`](docs/API.md) for the full endpoint reference.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Node.js, Express, MongoDB (Mongoose), Socket.io |
| Auth | JWT (stateless — no server-side sessions) |
| Validation | Zod |
| Email | Nodemailer, with an automatic Ethereal fallback in development |
| Realtime | Socket.io (team chat + live notifications, one shared server) |

## Project structure

```
backend/
  server.js            Express app assembly, route mounting, boot sequence
  src/
    config/             Env loading + validation, DB connection
    middleware/          Auth (JWT) + request-validation middleware
    validation/           Zod schemas
    routes/               One file per domain (auth, admin, organizer, participant, ...)
    controllers/          Business logic
    models/               Mongoose schemas
    sockets/              Socket.io: team chat + personal notification rooms
    utils/                 Auth helpers, email service, notifications, access control
  scripts/seed.js         Idempotent demo data (sample clubs + events)

frontend/
  src/
    pages/                Route-level components, grouped by actor (auth/participant/organizer/admin)
    components/            Shared UI (nav bars, theme toggle, notification bell) + design-system primitives
    context/                AuthContext (global auth state)
    hooks/                  useTheme, useNotifications, useClickOutside
    api/                    One axios wrapper module per backend domain
    styles/                 Design tokens (theme.css) + typography (fonts.css)

docs/                     Architecture, backend, frontend, database, API, and deployment docs
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the system diagram and
actor/auth model, [`docs/BACKEND.md`](docs/BACKEND.md) and
[`docs/FRONTEND.md`](docs/FRONTEND.md) for how each app is organized, and
[`docs/DATABASE.md`](docs/DATABASE.md) for the data model.

## Getting started

```bash
# Backend
cd backend
cp .env.example .env    # fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL/PASSWORD
npm install
npm run dev              # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Optionally seed demo data: `cd backend && npm run seed`.

Full setup, environment variables, and a production deployment guide (Vercel +
Render + MongoDB Atlas, or any equivalent) live in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Testing

```bash
cd backend && npm test
```

A focused Vitest + Supertest suite covers auth, registration, password reset,
and attendance scanning — see `backend/tests/` and
[`docs/BACKEND.md`](docs/BACKEND.md#tests) for scope.

## Configuring for your own institution (optional)

Convene ships with an optional "affiliated vs. general" participant
distinction (e.g. "students of this college" vs. everyone else), fully
configurable via environment variables — no code changes needed:

- `INSTITUTION_NAME` / `INSTITUTION_EMAIL_DOMAINS` (backend)
- `VITE_INSTITUTION_NAME` / `VITE_INSTITUTION_EMAIL_DOMAINS` (frontend)

Leave the domain variables empty to disable the distinction entirely.

## Contributing

Issues and pull requests are welcome. For anything non-trivial, please open an
issue first to discuss the change.

## License

[MIT](LICENSE)
