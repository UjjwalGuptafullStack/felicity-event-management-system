# Backend

Node.js + Express, MongoDB via Mongoose, Socket.io for realtime. No framework
beyond Express itself — routes, controllers, and models are plain modules.

## Layout

```
backend/
  server.js                  Express app assembly, route mounting, error handler, boot sequence
  src/
    config/
      env.js                 Loads + validates env vars, fails fast if JWT_SECRET is missing
      db.js                  Mongoose connection
    middleware/
      authContracts.js       authenticate() + requireActor/requireRole primitives and convenience wrappers
      validate.js             Zod-schema request validation middleware
    validation/
      schemas.js              Zod schemas (auth, organizer creation)
    routes/                   One file per domain, thin — auth middleware + controller wiring only
    controllers/               Business logic, one file per domain
    models/                   Mongoose schemas
    sockets/
      teamChat.js             Socket.io server: team chat rooms + personal notification rooms
    utils/
      authHelpers.js          JWT sign/verify, password hashing, payload shape helpers
      accessControl.js        ownsEvent() ownership checks for organizer-scoped resources
      notify.js                Creates a Notification doc + pushes it live over the socket
      passwordReset.js         Shared self-service reset-token issuance/lookup
      emailService.js          nodemailer wrapper with automatic Ethereal fallback in dev
      asyncHandler.js          Wraps an async route handler so rejections reach the error middleware
      constants.js             Enums shared by models/controllers (actor types, categories, statuses)
    scripts/
      seed.js                 Demo data: 8 sample clubs + realistic events, idempotent
```

## Routing

Each route file owns one domain and is mounted at `/` in `server.js` (routes
carry their own full path prefix, e.g. `/organizer/events/:id/publish`) —
except `authRoutes`, `adminRoutes`, `organizerRoutes`, and `participantRoutes`,
which are mounted under `/auth`, `/admin`, `/organizer`, `/participant`
respectively. `merchandiseRoutes.js`, `attendanceRoutes.js`,
`discussionRoutes.js`, `feedbackRoutes.js`, `analyticsRoutes.js`, and
`notificationRoutes.js` were split out of what used to be a single grab-bag
`part2Routes.js` file — each is now scoped to one feature and readable on its
own.

## Auth middleware chain

```
authenticate → requireActor(type) → requireRole(role)   (primitives)
authenticate → requireAdmin() / requireOrganizer() / requireParticipant()  (convenience wrappers)
```

`authenticate` verifies the JWT and attaches `req.actor = { id, actorType, role? }`.
Every other check reads from `req.actor` — there is no session state, no
cookies; the JWT is the only source of truth for who's making the request.

## Validation

`middleware/validate.js` + `validation/schemas.js` cover:

- `POST /auth/participant/register`, `/auth/participant/login`,
  `/auth/admin/login`, `/auth/organizer/login`, `/auth/forgot-password`,
  `/auth/reset-password`
- `POST /admin/organizers` (this is also where the organizer-category enum is
  validated at the API boundary, in addition to the Mongoose schema enum)

Everything else still relies on manual `if (!field) return res.status(400)...`
checks inline in the controller — a known gap, not an oversight. If you're
extending an unvalidated endpoint, prefer adding a Zod schema over another
inline check.

## Error handling

Most controllers still wrap their body in `try { ... } catch (error) { ...
res.status(500) }` — that pattern predates this pass and hasn't been fully
retrofitted. Newer code (`utils/asyncHandler.js`, the error middleware in
`server.js`) supports throwing an `ApiError(statusCode, message)` (see
`utils/ApiError.js`) and letting it bubble to the centralized handler, which
also recognizes Mongoose `ValidationError`s. Prefer that pattern for new
controllers; retrofitting the ~14 existing controllers is a mechanical follow-up,
not something this pass did wholesale.

## Notifications

`utils/notify.js` is the single entry point for creating a `Notification`
document and pushing it live to a connected client:

```js
const { notify } = require('../utils/notify');

notify({
  recipientType: ACTOR_TYPES.USER,   // or ACTOR_TYPES.ORGANIZER
  recipientId: participantId,
  type: 'registration_confirmed',
  title: 'Registration confirmed',
  message: `You're registered for ${event.name}.`,
  link: `/participant/events/${event._id}`
});
```

It's fire-and-forget by design (not awaited by callers) — a failed
notification never blocks the primary action (registration, payment approval,
etc). Currently wired into: registration confirmation, merchandise
approve/reject, and event publish (notifies followers of that organizer).

## Password reset

Self-service, token-based, for both participants and organizers —
`POST /auth/forgot-password` issues a single-use, 1-hour token (hashed with
SHA-256 before storage in `PasswordResetToken`, mirroring how passwords
themselves are never stored in plaintext) and emails a reset link;
`POST /auth/reset-password` consumes it. `utils/passwordReset.js` holds the
shared issue/consume logic so the admin-triggered "send reset link" action
(`POST /admin/organizers/:id/reset-password`) reuses the exact same flow
instead of duplicating it. This replaced an earlier manual
admin-approval-request flow (organizer submits a reason → admin reviews →
admin generates a password) that added multiple round trips for no real
security benefit over an emailed, single-use, expiring link.

## Email

`utils/emailService.js` wraps `nodemailer`. If `SMTP_HOST`/`SMTP_USER` aren't
configured, it transparently creates a free Ethereal test account on first
send and logs a preview URL to the console — so registration/reset emails are
fully exercisable in local dev with zero SMTP setup.

## Database

See `docs/DATABASE.md` for the model list, relationships, and indexes.

## Tests

`backend/` uses Vitest + Supertest for a focused set of integration tests
covering auth (register/login), registration, password reset, and attendance
scanning — see `backend/tests/` and run with `npm test`. This is intentionally
not exhaustive coverage; it closes the "zero tests anywhere" gap on the
highest-value paths rather than chasing 100%.
