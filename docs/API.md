# API Reference

Base URL: `http://localhost:5000` in development (`VITE_API_BASE_URL` in the
frontend points at whatever the backend is deployed to). All responses are
JSON of the shape `{ success: boolean, message?, ...data }`. Authenticated
routes expect `Authorization: Bearer <jwt>`.

## Auth — `/auth`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/participant/register` | — | Derives `participantType` from email domain if not provided |
| POST | `/auth/participant/login` | — | |
| POST | `/auth/organizer/login` | — | |
| POST | `/auth/admin/login` | — | No registration endpoint exists — admin is bootstrap-only |
| POST | `/auth/forgot-password` | — | `{ email, actorType: 'participant'\|'organizer' }`. Always 200, generic message |
| POST | `/auth/reset-password` | — | `{ token, actorType, newPassword }` |

## Admin — `/admin` (requires admin)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dashboard` | Summary counts + recent organizers |
| GET | `/admin/stats` | Total users/organizers/events |
| POST | `/admin/organizers` | Creates an organizer; auto-generates login email + temp password, emails credentials |
| GET | `/admin/organizers` | List all |
| GET | `/admin/organizers/:id` | Detail |
| PATCH | `/admin/organizers/:id/disable` / `/enable` | Toggle account access |
| DELETE | `/admin/organizers/:id` | Cascade-deletes all of the organizer's events + dependent data |
| POST | `/admin/organizers/:id/reset-password` | Sends a self-service reset link (see `docs/BACKEND.md`) |

## Organizer — `/organizer` (requires organizer)

| Method | Path | Notes |
|---|---|---|
| GET / PATCH | `/organizer/profile` | |
| POST | `/organizer/me/change-password` | Requires current password |
| GET | `/organizer/dashboard` | |
| POST | `/organizer/events` | Always created as `draft` |
| GET | `/organizer/events` | |
| GET / PATCH | `/organizer/events/:id` | |
| POST | `/organizer/events/:id/publish` | Draft → published; notifies followers |
| GET | `/organizer/events/:id/registrations` | Query: `attended`, `participantType` |
| GET | `/organizer/events/:id/registrations/export` | CSV download |
| GET | `/organizer/events/:id/analytics` | Single-event snapshot (registrations, attendance, revenue, fill rate) |
| GET | `/organizer/analytics/overview` | Cross-event trend data for the Analytics page |
| POST | `/organizer/events/:id/close-registrations` | |
| GET | `/organizer/merchandise/pending` | |
| POST | `/organizer/merchandise/:regId/approve` \| `/reject` | |
| POST | `/organizer/events/:id/attendance/scan` \| `/manual` | |
| GET | `/organizer/events/:id/attendance` | |
| GET | `/organizer/events/:id/attendance/export` | CSV download |
| GET | `/organizer/events/:id/feedback` \| `/feedback/stats` \| `/feedback/export` | |
| POST / DELETE | `/organizer/events/:id/discussion/...` | Pin/unpin/delete/announce (moderation) |

## Participant — `/participant` (requires participant)

| Method | Path | Notes |
|---|---|---|
| GET / PATCH | `/participant/me/profile` | |
| POST | `/participant/me/change-password` | |
| GET | `/participant/me/dashboard` | |
| GET | `/participant/events` | Browse published events |
| GET | `/participant/events/:id` | |
| POST | `/participant/events/:id/register` | Normal-event registration; issues ticket + email + notification |
| POST | `/participant/events/:id/purchase` | Merchandise purchase; auto-approves if `requiresApproval: false` |
| GET | `/participant/me/registrations` | |
| GET | `/participant/organizers` | Discovery/browse clubs |
| GET | `/participant/organizers/:id` | |
| POST | `/participant/organizers/:id/follow` \| `/unfollow` | |
| POST | `/participant/events/:eventId/teams` | Create a team for a team-registration event |
| POST | `/participant/teams/join` | `{ inviteCode }` |
| GET | `/participant/me/teams` | |
| GET | `/participant/teams/:teamId` | |
| DELETE | `/participant/teams/:teamId` | Leader cancels |
| POST | `/participant/teams/:teamId/leave` | |

## Shared / cross-actor

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/public/stats` | — | Landing-page counters |
| POST / GET | `/events/:id/discussion/messages` | any actor | Per-event discussion thread |
| POST | `/participant/events/:id/feedback` | participant | |
| GET | `/notifications` | any actor | Paginated, includes `unreadCount` |
| PATCH | `/notifications/:id/read` \| `/notifications/read-all` | any actor | |
| GET / POST | chat file endpoints (`chatRoutes.js`) | participant (team member) | File attachments for team chat |
| GET | `/health` | — | Liveness check |

## Realtime (Socket.io)

Handshake: `io(BACKEND_URL, { auth: { token } })`. Every connected actor
auto-joins a personal room and receives `notification:new` events. Participants
additionally use: `join-team` / `leave-team`, `send-message` / `send-file-message`
→ `new-message`, `typing` / `stop-typing` → `user-typing` / `user-stop-typing`,
and `presence-update` for online-member tracking. See `docs/ARCHITECTURE.md`
for the room-naming scheme.
