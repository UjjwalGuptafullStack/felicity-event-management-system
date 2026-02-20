# Felicity Event Management System

> **DASS 2025–26 Assignment** · Full-Stack Event Management Platform for IIIT Hyderabad's Annual Felicity Festival

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Setup & Running](#4-setup--running)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Database Models](#6-database-models)
7. [Part 1 – Core Features](#7-part-1--core-features)
8. [Part 2 – Advanced Features](#8-part-2--advanced-features)
9. [API Reference](#9-api-reference)
10. [Frontend Pages & Components](#10-frontend-pages--components)
11. [Email System](#11-email-system)
12. [Design System & Theme](#12-design-system--theme)

---

## 1. Project Overview

Felicity EMS is a full-stack event management platform that supports three distinct user roles — **Participants**, **Organizers (Clubs)**, and **Admins** — each with dedicated dashboards, access controls, and workflows.

### Key Capabilities

| Capability | Description |
|---|---|
| Multi-role auth | Separate login flows and JWT tokens for participants, organizers, admins |
| Event lifecycle | Draft → Published → Ongoing → Closed with per-role permissions |
| QR ticketing | Auto-generated QR ticket on registration; camera-based scanning at events |
| Attendance tracking | Full dashboard, duplicate prevention, audit-logged manual override, CSV export |
| Merchandise workflow | Purchase → Payment proof upload → Organizer approval/rejection → Stock deduction |
| Team registration | Create teams with invite codes; team captain leads the group registration |
| Team chat | Real-time Socket.io chat per team (when complete): file sharing, typing indicator, online presence |
| Password reset | Organizer-initiated request → Admin approve/reject with email notification |
| Discussion forum | Per-event message board with anonymous participants, pin/announce/delete moderation |
| Feedback system | Post-event star ratings + comments; anonymous aggregate stats + CSV export for organizers |
| Organizer discovery | Participants can browse and follow clubs/organizers |
| Recommended events | Events matching user interests float to top of Browse Events |

---

## 2. Technology Stack

### Backend
| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20.x |
| Framework | Express.js | 4.18 |
| Database | MongoDB Atlas (Mongoose ODM) | 8.1 |
| Auth | JSON Web Tokens (jsonwebtoken) | 9.0 |
| Password hashing | bcrypt | 5.1 |
| Email | Nodemailer (Ethereal fallback / Gmail SMTP) | 8.0 |
| Real-time | socket.io | 4.8 |
| File upload | multer | 2.x |
| QR generation | qrcode | 1.5 |
| Environment | dotenv | 16.4 |
| Dev server | nodemon | 3.0 |

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.2 |
| Bundler | Vite | 5.4 |
| Routing | React Router DOM | 6.28 |
| Styling | Tailwind CSS v4 | 4.1 |
| Animation | Motion (Framer Motion) | 12.x |
| Icons | lucide-react | 0.487 |
| HTTP client | Axios | 1.13 |
| QR Scanning | html5-qrcode | 2.3 |
| Real-time | socket.io-client | 4.8 |
| Utilities | clsx, tailwind-merge | latest |

---

## 3. Architecture

```
felicity-event-management-system/
├── backend/
│   ├── server.js               # Express app entry point
│   ├── .env                    # Environment variables
│   └── src/
│       ├── config/
│       │   ├── db.js           # MongoDB Atlas connection
│       │   └── env.js          # Centralised env config object
│       ├── controllers/        # Business logic, one file per feature domain
│       │   └── chatController.js       # Chat message retrieval + file upload
│       ├── middleware/
│       │   └── authContracts.js        # JWT decode + role guards
│       ├── models/             # Mongoose schemas
│       │   └── ChatMessage.js          # Team chat message persistence
│       ├── routes/             # Express routers grouped by actor
│       │   └── chatRoutes.js           # GET messages + POST file upload
│       ├── sockets/
│       │   └── teamChat.js             # Socket.io setup (rooms, presence, events)
│       └── utils/
│           ├── accessControl.js
│           ├── authHelpers.js          # bcrypt helpers
│           ├── bootstrap.js            # Admin seed on first start
│           ├── constants.js            # System-wide enums
│           └── emailService.js         # Nodemailer wrapper
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Route definitions
        ├── api/                # Axios API call wrappers (one per domain)
        │   └── chat.js                 # getChatMessages, uploadChatFile
        ├── auth/
        ├── components/         # Reusable UI (nav bars, design system)
        ├── context/
        │   └── AuthContext.jsx         # Global auth state (JWT decode, login/logout)
        ├── layouts/            # OrganizerLayout, ParticipantLayout (with nested Outlet)
        ├── pages/              # One folder per actor role
        │   ├── participant/
        │   │   ├── TeamChat.jsx        # Real-time team chat UI
        │   │   └── EventDiscussion.jsx # Event discussion forum (anonymous)
        ├── routes/             # ProtectedRoute, RoleRoute guards
        ├── sockets/
        │   └── socket.js               # Singleton Socket.io-client with JWT auth
        └── styles/             # theme.css, tailwind.css, fonts.css
```

### Request Flow

```
Browser → React (Vite dev server :5173)
       → Axios (Authorization: Bearer <JWT>) 
       → Express (:5000)
       → authenticate middleware (verify JWT)
       → requireOrganizer / requireParticipant / requireAdmin guard
       → Controller (business logic)
       → Mongoose → MongoDB Atlas
```

---

## 4. Setup & Running

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas cluster (connection string ready)

### 1. Clone and install

```bash
git clone <repo>
cd felicity-event-management-system

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Backend environment variables

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/felicity

# JWT
JWT_SECRET=your-secret-here
JWT_EXPIRY=7d

# Bcrypt
BCRYPT_ROUNDS=10

# IIIT domain validation
IIIT_EMAIL_DOMAIN=@iiit.ac.in

# Admin bootstrap (auto-created on first run)
ADMIN_EMAIL=admin@iiit.ac.in
ADMIN_PASSWORD=YourAdminPassword
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator

# SMTP (optional – Ethereal test account used if absent)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your@gmail.com
# SMTP_PASS=xxxx xxxx xxxx xxxx    # Gmail App Password
# SMTP_FROM=Felicity Events <your@gmail.com>
```

### 3. Run (development)

```bash
# Terminal 1 – backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 – frontend (http://localhost:5173)
cd frontend && npm run dev
```

### 4. Admin account

On first backend start, `bootstrap.js` automatically creates the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Log in at `/login/admin`.

---

## 5. Authentication & Authorization

### Multi-Actor JWT System

The system supports **two separate identity classes**:

| Actor Type | Lives in | Roles |
|---|---|---|
| `user` | `User` collection | `participant`, `admin` |
| `organizer` | `Organizer` collection | *(no sub-roles)* |

Every JWT payload includes `{ id, actorType, role }`. The `authContracts.js` middleware decodes and attaches this as `req.actor`.

### Middleware Guards

| Middleware | Effect |
|---|---|
| `authenticate` | Verifies JWT signature, attaches `req.actor`. 401 if missing/invalid. |
| `requireParticipant()` | 403 if `actorType !== "user"` or `role !== "participant"` |
| `requireOrganizer()` | 403 if `actorType !== "organizer"` |
| `requireAdmin()` | 403 if `actorType !== "user"` or `role !== "admin"` |

### Frontend Route Guards

| Component | Path | Access |
|---|---|---|
| `ProtectedRoute` | Any | Requires `isAuthenticated` |
| `RoleRoute` | `/participant/*` | `actorType=user, role=participant` |
| `RoleRoute` | `/organizer/*` | `actorType=organizer` |
| `RoleRoute` | `/admin/*` | `actorType=user, role=admin` |

Auth state is stored in `localStorage` as `actor` (the decoded JWT payload). `AuthContext` provides `login()`, `logout()`, `isAuthenticated`, `actorType`, `role`.

---

## 6. Database Models

### User
```
firstName, lastName, email (unique, IIIT domain validated),
passwordHash, role (participant|admin), participantType (iiit|non-iiit),
contactNumber, bio, interests[], preferences{},
followedOrganizers[] → ref Organizer,
isOnboarded (bool), createdAt
```

### Organizer
```
name, category (free string – one of the predefined club categories),
description, contactEmail, contactNumber,
loginEmail (auto-generated, unique), passwordHash,
isActive (bool), createdAt
```
**Category options (admin dropdown):** Technical · Cultural · Sports · Literary & Debate · Gaming · Social & Volunteer · Entrepreneurship · Music & Fine Arts · Media & Photography · Other

### Event
```
name, description,
type (normal|merchandise),
categories[] → validated against EVENT_CATEGORIES enum,
eligibility, registrationDeadline, startDate, endDate,
registrationLimit, registrationFee,
organizerId → ref Organizer,
tags[], status (draft|published|ongoing|closed),
merchandiseDetails.items[{name, description, variants[{type, stock, price}], image}],
teamRegistration{enabled, minSize, maxSize}
```

### Registration
```
participantId → ref User,
eventId → ref Event,
registrationType (normal|merchandise),
status (registered|cancelled|rejected),
teamId → ref Team,
paymentProof (string), createdAt
```
Compound unique index: `{ participantId, eventId }` — prevents duplicate registrations.

### Ticket
```
registrationId → ref Registration,
ticketId (string, unique — e.g. "TKT-A1B2C3D4E5F6G7H8"),
qrCode (string = ticketId, used to look up during scanning),
isScanned (bool, default false),
scannedAt (Date), issuedAt (Date)
```

### Attendance
```
eventId → ref Event,
ticketId → ref Ticket (unique — one attendance record per ticket),
registrationId → ref Registration,
participantId → ref User,
scannedAt (Date, default now),
scannedBy → ref Organizer,
scanMethod (qr_scan | manual_entry),
remarks (string, for manual override audit)
```
Indexes: `{ eventId, participantId }`, `{ eventId, scannedAt }`, unique on `ticketId`.

### Team
```
name, eventId → ref Event,
captainId → ref User,
members[] → ref User,
inviteCode (unique random string),
status (forming | complete | cancelled),
maxSize, minSize
```

### PasswordResetRequest
```
organizerId → ref Organizer,
reason (string),
status (pending | approved | rejected),
adminNote (string),
requestedAt, resolvedAt
```

### Feedback
```
eventId → ref Event,
participantId → ref User,
rating (1–5),
comment (string),
createdAt
```
Unique index: `{ eventId, participantId }` — one submission per participant per event.

### DiscussionMessage
```
eventId → ref Event,
authorId (string), authorType (user | organizer),
content (string),
isPinned (bool), isAnnouncement (bool),
createdAt
```

---

## 7. Part 1 – Core Features

### 7.1 Multi-Actor Authentication

**Registration (Participants only)**  
`POST /participant/register`  
- Email validated against `IIIT_EMAIL_DOMAIN` (configurable — set to `@iiit.ac.in`)
- Password hashed with bcrypt (configurable rounds, default 10)
- JWT returned immediately on success
- **Non-IIIT participants** can also register; `participantType` is set to `non-iiit`

**Login endpoints**

| Actor | Endpoint | Notes |
|---|---|---|
| Participant | `POST /participant/login` | email + password |
| Organizer | `POST /organizer/login` | auto-generated loginEmail + password |
| Admin | `POST /admin/login` | seeded from `.env` |

All login endpoints return `{ token, actor: { id, actorType, role, ... } }`.

**Organizer account creation**  
Organizers cannot self-register. The Admin creates accounts via `POST /admin/organizers`.  
- Login email auto-generated from organizer name (e.g. "Tech Club" → `tech.club@iiit.ac.in`)
- A random 16-character hex temporary password is generated
- Credentials are emailed to the organizer's contact address and also returned in the API response for the admin to share

### 7.2 Event Lifecycle Management

Events follow this status progression:

```
draft  →  published  →  [ongoing → closed]
```

- **Draft**: Visible only to the organizer who created it. Cannot be registered for.
- **Published**: Visible to all participants. Open for registration (if before deadline and below limit).
- **Ongoing / Closed**: Status transitions can be managed by the organizer.

**Organizer event CRUD**

| Operation | Endpoint |
|---|---|
| Create | `POST /organizer/events` |
| List own | `GET /organizer/events` |
| Get one | `GET /organizer/events/:id` |
| Update | `PATCH /organizer/events/:id` |
| Publish | `POST /organizer/events/:id/publish` |
| View registrations | `GET /organizer/events/:id/registrations` |

### 7.3 Participant Event Registration

`POST /participant/events/:id/register`

**Validation checks performed:**
1. Event must be `published` or `ongoing`
2. Registration deadline not passed
3. Capacity not reached (`registrationLimit`)
4. Participant not already registered (enforced at DB level via unique index)
5. Eligibility rules (IIIT-only events block `non-iiit` participants)

**On success:**
1. A `Registration` document is created (`status: registered`)
2. A `Ticket` is created with a unique `ticketId` (format: `TKT-<16 hex chars>`) and `qrCode = ticketId`
3. A confirmation email is sent (Ethereal preview URL returned in dev mode)

### 7.4 Admin – Organizer Management

The admin can:

| Action | Endpoint |
|---|---|
| Create organizer with category dropdown | `POST /admin/organizers` |
| List all organizers | `GET /admin/organizers` |
| View single organizer | `GET /admin/organizers/:id` |
| Disable (soft delete) | `PATCH /admin/organizers/:id/disable` |
| Re-enable | `PATCH /admin/organizers/:id/enable` |
| Permanently delete | `DELETE /admin/organizers/:id` |
| View dashboard stats | `GET /admin/dashboard` |

**Club Category dropdown (admin form)**  
When creating a club/organizer the admin selects from a predefined list:  
Technical · Cultural · Sports · Literary & Debate · Gaming · Social & Volunteer · Entrepreneurship · Music & Fine Arts · Media & Photography · Other

### 7.5 Organizer Discovery & Follow System

Participants can browse all active organizers and follow/unfollow them.

| Endpoint | Description |
|---|---|
| `GET /participant/organizers` | List all active organizers with follower counts |
| `GET /participant/organizers/:id` | Organizer profile + their events |
| `POST /participant/organizers/:id/follow` | Follow organizer |
| `POST /participant/organizers/:id/unfollow` | Unfollow organizer |

Followed organizer IDs are stored in `User.followedOrganizers[]`.

### 7.6 Team Registration

For events with `teamRegistration.enabled = true`:

| Action | Endpoint |
|---|---|
| Create team | `POST /participant/events/:eventId/teams` |
| Join by invite code | `POST /participant/teams/join` |
| List my teams | `GET /participant/me/teams` |
| View team | `GET /participant/teams/:teamId` |
| Cancel team (captain) | `DELETE /participant/teams/:teamId` |
| Leave team | `POST /participant/teams/:teamId/leave` |

Teams have a random invite code. When a team reaches `maxSize`, all members are automatically registered and tickets are issued.

### 7.7 Participant Dashboard (5-Tab Layout)

Route: `/participant/dashboard`  
Tabs:
1. **Overview** – Personalized stats, upcoming events, recent registrations
2. **My Events** – All registered events with ticket IDs
3. **Teams** – Teams I'm part of with invite codes
4. **Organizers** – Browse/search clubs, follow/unfollow
5. **Profile** – Edit name, bio, contact, interests

### 7.8 Participant Onboarding

After first login, participants are redirected to `/participant/onboarding` where they:
- Complete their profile (contact number, bio)
- Select interests (used for personalized recommendations)
- Set `isOnboarded = true` on completion

---

## 8. Part 2 – Advanced Features

### 8.1 Merchandise Payment Approval Workflow (Tier A1 – 8 Marks)

**Purpose:** Prevent stock commitment before payment is verified.

**Flow:**
```
Participant purchases → Registration created (status: pending)
                     → Organizer sees in "Pending Approvals"
                     → Approve → ticket issued, stock decremented
                     → Reject → registration status: rejected, reason stored
```

**Implementation:**

*Backend:*
- `POST /participant/events/:id/merchandise/purchase` — Creates a `Registration` with `registrationType: merchandise`, `status: pending`. Stores payment proof reference.
- `GET /organizer/merchandise/pending` — Returns all pending merchandise registrations for the organizer's events, populated with participant details and item names.
- `POST /organizer/merchandise/:regId/approve` — Sets `status: registered`, decrements stock, issues ticket with QR code.
- `POST /organizer/merchandise/:regId/reject` — Sets `status: rejected`, stores rejection reason.

*Frontend (`organizer/MerchandiseApprovals.jsx`):*
- Table of pending purchases with participant info, event name, item details
- Approve / Reject buttons with confirmation dialog
- Rejection reason modal (required text input)
- Auto-refreshes after each action

### 8.2 QR Code Attendance Tracking (Tier A2 – 8 Marks)

**Purpose:** Real-time, duplicate-safe attendance marking with full audit trail.

**Flow:**
```
Participant registers → Ticket created (qrCode = ticketId)
                     → Confirmation email with Ticket ID
At event: Organizer scans QR → Attendance record created
                             → Ticket.isScanned = true
                             → Duplicate rejected with original scan time
```

**Implementation:**

*Backend (`attendanceController.js`, `models/Attendance.js`):*
- `POST /organizer/events/:id/attendance/scan` — Accepts `{ qrCode }`. Finds ticket by qrCode field, verifies event ownership, checks `ticket.isScanned` and `Attendance` unique index on `ticketId` to reject duplicates. Returns participant name/email on success.
- `POST /organizer/events/:id/attendance/manual` — Accepts `{ participantEmail, remarks }`. Finds participant → registration → ticket. Creates attendance with `scanMethod: manual_entry`. Full audit logging via `remarks` field.
- `GET /organizer/events/:id/attendance` — Returns attendance list + stats: `{ totalRegistrations, attendanceCount, attendanceRate }`. Each record includes `participant`, `scannedAt`, `scanMethod`, `scannedBy`, `remarks`.
- `GET /organizer/events/:id/attendance/export` — Streams a CSV with headers: Name, Email, Contact, Scanned At, Scan Method, Remarks.

*Frontend (`organizer/AttendanceScanner.jsx`):*
The page has **4 tabs**:

| Tab | Feature |
|---|---|
| 📷 Camera Scanner | Live camera QR scanning via `html5-qrcode`. Auto-pauses after each scan; resumes after 2.5 s. Permission prompt handled by the library. |
| ⌨ Text / Scanner | Text input for USB keyboard-wedge QR scanners or manual ticket ID paste. Auto-focus for speed. |
| ✏️ Manual Override | Email + remarks form. Creates `manual_entry` attendance record. Audit note exported to CSV. |
| 📋 Records | Full attendance table sortable by scan time. Badges: 📷 QR Scan vs ✏️ Manual. Export CSV button. |

**Stats bar** (always visible): Attended · Registered · Attendance Rate · Not Yet Scanned

**Duplicate handling:** Shows orange ⚠ warning with original scan timestamp. Does **not** overwrite.

### 8.3 Organizer Password Reset Workflow (Tier B1 – 5 Marks)

**Purpose:** Allow organizers to request credential resets through admin approval.

**Flow:**
```
Organizer submits reason → Admin sees pending requests
                        → Approve → new password generated + emailed
                        → Reject → reason stored, organizer notified
```

**Implementation:**

*Endpoints:*
- `POST /password-reset/request` — Public endpoint (no auth). Accepts `{ organizerEmail, reason }`.
- `POST /organizer/password-reset/request` — Authenticated organizer endpoint.
- `GET /organizer/password-reset/my-requests` — View own request history.
- `GET /admin/password-reset/requests` — Admin sees all requests with status.
- `POST /admin/password-reset/:id/approve` — Generates new password, hashes it, emails to organizer.
- `POST /admin/password-reset/:id/reject` — Stores rejection reason.

*Frontend:*
- `pages/auth/OrganizerPasswordReset.jsx` — Public form for organizers to submit reset requests
- `pages/admin/PasswordResetRequests.jsx` — Admin dashboard listing all requests with Approve/Reject actions

### 8.4 Event Discussion Forum (Tier B2 – 5 Marks)

**Purpose:** Per-event message board for participant interaction and organizer announcements.

**Features:**
- Both participants and organizers can post messages
- Organizers can **pin** important messages (shown at top)
- Organizers can post **announcements** (tagged differently)
- Organizers can **delete** any inappropriate message
- Organizers can **unpin** messages
- Participant identities shown as **"Anonymous"** in the participant-facing UI (privacy by design)
- Organizer messages are highlighted with a distinct avatar badge

**Endpoints:**
- `POST /events/:id/discussion/messages` — Post message (any authenticated actor)
- `GET /events/:id/discussion/messages` — Get all messages (pinned first)
- `POST /organizer/events/:id/discussion/messages/:messageId/pin`
- `POST /organizer/events/:id/discussion/messages/:messageId/unpin`
- `DELETE /organizer/events/:id/discussion/messages/:messageId`
- `POST /organizer/events/:id/discussion/announcement` — Post announcement

**Frontend:**
- `EventDiscussion.jsx` (`/participant/events/:id/discussion`) — full discussion page accessible from EventDetails with anonymous participant display, Enter-to-send, 2000-char limit
- Organizer panel inside `EventDetail.jsx` — post announcement, pin/unpin/delete per message

### 8.5 Post-Event Feedback & Ratings (Tier C1 – 4 Marks)

**Purpose:** Collect structured participant feedback for organizer review.

**Features:**
- **1–5 star rating** + optional text comment (1000 char limit)
- Gated on attendance: participant must have an `Attendance` record (must have physically attended)
- One submission per participant per event (unique index)
- Organizers see aggregated stats: average rating, distribution bars (5★→1★), rating filter
- Anonymous CSV export (participant IDs excluded)

**Endpoints:**
- `POST /participant/events/:id/feedback` — Submit `{ rating, comment }`. Validates attendance.
- `GET /participant/events/:id/feedback/my` — Participant checks own submission + eligibility.
- `GET /organizer/events/:id/feedback` — All feedback records (anonymous, with optional `?rating=` filter).
- `GET /organizer/events/:id/feedback/stats` — `{ averageRating, totalCount, distribution: { 1:n, 2:n, … } }`
- `GET /organizer/events/:id/feedback/export` — Streams anonymous CSV.

**Frontend:**
- Participant `EventDetails.jsx` — 5-star hover picker + comment form, shown only if event ended and user attended. Confirmed state on submission.
- Organizer `EventDetail.jsx` — feedback analytics panel with avg rating, distribution bars, filter buttons, scrollable comment list, Export CSV button.

### 8.6 Real-Time Team Chat (Socket.io)

**Purpose:** Persistent real-time chat for each complete team.

**Architecture:**
- Socket.io mounted on the same HTTP port as Express (`http.createServer(app)`)
- JWT authenticated at socket handshake; user name resolved from DB
- Each team gets a room: `team-<teamId>`
- Messages persisted to `ChatMessage` collection in MongoDB
- File uploads via REST: `POST /chat/team/:teamId/upload` (multer, 10 MB limit)

**Socket Events:**

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `join-team` | `{ teamId }` |
| Client → Server | `send-message` | `{ teamId, content }` |
| Client → Server | `send-file-message` | `{ teamId, fileUrl, fileName, fileType }` |
| Client → Server | `typing` / `stop-typing` | `{ teamId }` |
| Server → Room | `new-message` | full ChatMessage doc |
| Server → Room | `user-typing` / `user-stop-typing` | `{ userId, userName }` |
| Server → Room | `team-presence` | `{ onlineMembers }` |

**REST Endpoints:**
- `GET /chat/team/:teamId/messages?before=<ISO>&limit=20` — paginated history
- `POST /chat/team/:teamId/upload` — file upload, returns `{ fileUrl, fileName, fileType }`

**Frontend (`TeamChat.jsx`, route `/participant/teams/:teamId/chat`):**
- Message bubbles (own = right/primary, others = left/muted)
- Inline image preview; download links for other file types
- URL linkification in text messages
- Animated 3-dot typing indicator
- Online members panel with green presence dots
- Connection status indicator
- Cursor-based "Load More" pagination
- Auto-resize textarea; Enter to send, Shift+Enter for newline
- "Open Chat" button on Teams page for complete teams

---

## 9. API Reference

### Base URL
`http://localhost:5000`

### Authentication
All protected endpoints require: `Authorization: Bearer <JWT>`

### Response Format
All responses follow:
```json
{
  "success": true | false,
  "message": "...",
  "data": { ... }
}
```

### Endpoints Summary

#### Public
| Method | Path | Description |
|---|---|---|
| POST | `/participant/register` | Register new participant |
| POST | `/participant/login` | Participant login |
| POST | `/admin/login` | Admin login |
| POST | `/organizer/login` | Organizer login |
| POST | `/password-reset/request` | Submit org. password reset (public) |
| GET | `/public/stats` | Platform-wide stats (no auth) |

#### Admin (requires admin JWT)
| Method | Path | Description |
|---|---|---|
| GET | `/admin/dashboard` | Dashboard stats |
| GET | `/admin/stats` | Detailed stats |
| POST | `/admin/organizers` | Create organizer/club |
| GET | `/admin/organizers` | List all organizers (filter: `?isActive=true`) |
| GET | `/admin/organizers/:id` | Get single organizer |
| PATCH | `/admin/organizers/:id/disable` | Soft-disable organizer |
| PATCH | `/admin/organizers/:id/enable` | Re-enable organizer |
| DELETE | `/admin/organizers/:id` | Permanently delete organizer |
| GET | `/admin/password-reset/requests` | All password reset requests |
| POST | `/admin/password-reset/:id/approve` | Approve + regenerate password |
| POST | `/admin/password-reset/:id/reject` | Reject with reason |

#### Organizer (requires organizer JWT)
| Method | Path | Description |
|---|---|---|
| GET | `/organizer/profile` | Own profile |
| PATCH | `/organizer/profile` | Update profile |
| GET | `/organizer/dashboard` | Dashboard stats |
| POST | `/organizer/events` | Create event |
| GET | `/organizer/events` | List own events |
| GET | `/organizer/events/:id` | Get own event |
| PATCH | `/organizer/events/:id` | Update event |
| POST | `/organizer/events/:id/publish` | Publish draft event |
| GET | `/organizer/events/:id/registrations` | View registrations |
| GET | `/organizer/merchandise/pending` | Pending merchandise |
| POST | `/organizer/merchandise/:regId/approve` | Approve payment |
| POST | `/organizer/merchandise/:regId/reject` | Reject payment |
| POST | `/organizer/events/:id/attendance/scan` | Scan QR ticket |
| POST | `/organizer/events/:id/attendance/manual` | Manual attendance |
| GET | `/organizer/events/:id/attendance` | Attendance dashboard |
| GET | `/organizer/events/:id/attendance/export` | Export CSV |
| POST | `/organizer/password-reset/request` | Request password reset |
| GET | `/organizer/password-reset/my-requests` | Own reset requests |
| POST | `/organizer/events/:id/discussion/announcement` | Post announcement |
| POST | `/organizer/events/:id/discussion/messages/:msgId/pin` | Pin message |
| POST | `/organizer/events/:id/discussion/messages/:msgId/unpin` | Unpin message |
| DELETE | `/organizer/events/:id/discussion/messages/:msgId` | Delete message |
| GET | `/organizer/events/:id/feedback` | All feedback (optional `?rating=` filter) |
| GET | `/organizer/events/:id/feedback/stats` | Aggregated stats |
| GET | `/organizer/events/:id/feedback/export` | Export anonymous CSV |

#### Participant (requires participant JWT)
| Method | Path | Description |
|---|---|---|
| GET | `/participant/me/profile` | Own profile |
| PATCH | `/participant/me/profile` | Update profile |
| GET | `/participant/me/dashboard` | Dashboard data |
| GET | `/participant/events` | Browse published events |
| GET | `/participant/events/:id` | Event details |
| POST | `/participant/events/:id/register` | Register for event |
| POST | `/participant/events/:id/purchase` | Purchase merchandise |
| GET | `/participant/me/registrations` | My registrations + tickets |
| GET | `/participant/organizers` | Browse organizers |
| GET | `/participant/organizers/:id` | Organizer profile |
| POST | `/participant/organizers/:id/follow` | Follow organizer |
| POST | `/participant/organizers/:id/unfollow` | Unfollow organizer |
| POST | `/participant/events/:eventId/teams` | Create team |
| POST | `/participant/teams/join` | Join team by invite code |
| GET | `/participant/me/teams` | My teams |
| GET | `/participant/teams/:teamId` | Team details |
| DELETE | `/participant/teams/:teamId` | Cancel team (captain) |
| POST | `/participant/teams/:teamId/leave` | Leave team |
| POST | `/participant/events/:id/feedback` | Submit feedback (attendance required) |
| GET | `/participant/events/:id/feedback/my` | My feedback + eligibility check |
| GET | `/chat/team/:teamId/messages` | Paginated chat history (`?before=` cursor) |
| POST | `/chat/team/:teamId/upload` | Upload chat file (multipart, 10 MB max) |

#### Shared (any authenticated actor)
| Method | Path | Description |
|---|---|---|
| GET | `/events/:id/discussion/messages` | Get discussion messages |
| POST | `/events/:id/discussion/messages` | Post message |

---

## 10. Frontend Pages & Components

### Public Pages
| Page | Route | Description |
|---|---|---|
| `Home.jsx` | `/` | Landing page with public stats, navigation to login/register |
| `Register.jsx` | `/register` | Participant self-registration |
| `ParticipantLogin.jsx` | `/login/participant` | Participant login |
| `OrganizerLogin.jsx` | `/login/organizer` | Organizer login |
| `OrganizerPasswordReset.jsx` | `/organizer/forgot-password` | Password reset request form |
| `AdminLogin.jsx` | `/login/admin` | Admin login |

### Participant Pages (under `/participant/*`)
| Page | Route | Description |
|---|---|---|
| `Onboarding.jsx` | `/participant/onboarding` | First-login profile completion |
| `NewDashboard.jsx` | `/participant/dashboard` | 5-tab main dashboard |
| `BrowseEvents.jsx` | `/participant/browse-events` | Event discovery with search/filter |
| `EventDetails.jsx` | `/participant/events/:id` | Event info + registration + team controls + discussion |
| `Profile.jsx` | `/participant/profile` | Profile edit form |
| `Organizers.jsx` | `/participant/organizers` | Browse + follow clubs |
| `OrganizerDetail.jsx` | `/participant/organizers/:id` | Organizer profile + their events |
| `Teams.jsx` | `/participant/teams` | My teams management; "Open Chat" button for complete teams |
| `TeamChat.jsx` | `/participant/teams/:teamId/chat` | Real-time Socket.io team chat with file sharing and presence |
| `EventDiscussion.jsx` | `/participant/events/:id/discussion` | Anonymous discussion forum for event participants |

### Organizer Pages (under `/organizer/*`)
| Page | Route | Description |
|---|---|---|
| `Dashboard.jsx` | `/organizer/dashboard` | Stats overview, recent registrations |
| `Events.jsx` | `/organizer/events` | Event list with status badges |
| `EventDetail.jsx` | `/organizer/events/:id/detail` | Full event view + publish + registrations + discussion moderation panel + feedback analytics panel |
| `AttendanceScanner.jsx` | `/organizer/attendance/:eventId` | 4-tab QR scanner + attendance dashboard |
| `MerchandiseApprovals.jsx` | `/organizer/merchandise-approvals` | Pending merchandise payments |
| `Profile.jsx` | `/organizer/profile` | Organizer profile editor |

### Admin Pages
| Page | Route | Description |
|---|---|---|
| `Dashboard.jsx` | `/admin/dashboard` | Platform stats |
| `ManageOrganizers.jsx` | `/admin/organizers` | Create (with category dropdown), list, enable/disable, delete organizers |
| `PasswordResetRequests.jsx` | `/admin/password-resets` | Approve/reject organizer password resets |

### Reusable Components

| Component | Location | Purpose |
|---|---|---|
| `OrganizerLayout.jsx` | `layouts/` | Side nav + Outlet for all organizer pages |
| `ParticipantLayout.jsx` | `layouts/` | Top nav + Outlet for all participant pages |
| `ParticipantNav.jsx` | `components/` | Horizontal navigation bar for participants |
| `OrganizerNav.jsx` | `components/` | Collapsible sidebar nav for organizers |
| `GradientButton.jsx` | `components/design-system/` | Consistent CTA button with gradient variants |
| `EventCard.jsx` | `components/design-system/` | Event card used in browse and dashboards |
| `StatsCard.jsx` | `components/design-system/` | Dashboard statistic chip |
| `FloatingActionButton.jsx` | `components/design-system/` | Floating action trigger |
| `ProtectedRoute.jsx` | `routes/` | Redirects unauthenticated users to `/` |
| `RoleRoute.jsx` | `routes/` | Enforces actor type and role |

### API Layer (`src/api/`)
Each file wraps Axios calls for a specific domain. The shared `axios.js` instance:
- Base URL: `http://localhost:5000`
- Interceptor: Automatically injects `Authorization: Bearer <token>` from `localStorage.actor`

| File | Domain |
|---|---|
| `auth.js` | Login, register |
| `participant.js` | Events, registrations, teams, organizers, feedback, my-feedback |
| `organizer.js` | Events, attendance, merchandise, password reset, feedback analytics, CSV export |
| `admin.js` | Organizer CRUD, password reset management |
| `events.js` | Public event browsing |
| `discussion.js` | Discussion messages (post, pin, announce, delete) |
| `chat.js` | Team chat history + file upload |
| `public.js` | Public stats |

---

## 11. Email System

### Architecture

`emailService.js` provides a single `sendEmail({ to, subject, html, text })` function.
On startup it tries to initialise a transporter:

1. **If `SMTP_HOST` and `SMTP_USER` are set in `.env`** → uses the configured SMTP server (e.g. Gmail)
2. **Otherwise** → automatically creates a free [Ethereal](https://ethereal.email) test account

### Ethereal Mode (Development)

When Ethereal is used, emails are **not** delivered to real inboxes. Instead:
- A preview URL is logged to the server console after every send
- The registration API also returns `emailPreviewUrl` in its response
- The frontend shows this URL in the success notice so developers can inspect the email HTML

### Configuring Real Email (Gmail)

1. Enable 2FA on your Google account
2. Go to **My Account → Security → App Passwords** and create one for "Mail"
3. Add to `backend/.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   SMTP_FROM=Felicity Events <your@gmail.com>
   ```
4. Restart the backend — it auto-detects the credentials and switches out of Ethereal mode.

### Email Templates

All email templates are styled HTML (dark-green theme, monospace font) and include a plain-text fallback.

| Template | Trigger | Content |
|---|---|---|
| Organizer Credentials | Admin creates organizer | Login email, temporary password |
| Registration Confirmation | Participant registers | Event details, ticket ID chip |
| Password Reset Approved | Admin approves request | New temporary password |
| Password Reset Rejected | Admin rejects request | Admin note / reason |

---

## 12. Design System & Theme

### Color Palette (CSS custom properties in `theme.css`)

| Variable | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0a0e0a` | Page background |
| `--bg-secondary` | `#111611` | Card backgrounds |
| `--accent` | `#4caf50` (green) | Primary actions, links |
| `--accent-hover` | `#66bb6a` | Hover states |
| `--text-primary` | `#e8f5e9` | Main text |
| `--text-secondary` | `#a5d6a7` | Subheadings |
| `--text-muted` | `#90a4ae` | Placeholder, labels |
| `--border` | `rgba(255,255,255,0.1)` | Card borders |
| `--destructive` | `#ef5350` | Error states |

### Typography

Inter (primary) + Fira Code (monospace for ticket IDs, credentials) loaded via `fonts.css`.

### Motion

Framer Motion (imported as `motion` v12) used for:
- Page element entrance animations (`initial: { opacity:0, y:20 }`)
- Button hover/tap scale feedback
- Modal show/hide transitions (AnimatePresence)
- List item stagger animations

### Tailwind CSS v4

Project uses Tailwind CSS v4 with `@tailwindcss/vite` plugin. Custom semantic tokens (`--foreground`, `--card`, `--border`, `--primary`, etc.) are bridged via `tailwind.css` and used throughout components.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Express server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs |
| `JWT_EXPIRY` | No | `7d` | JWT expiry duration |
| `BCRYPT_ROUNDS` | No | `10` | bcrypt cost factor |
| `IIIT_EMAIL_DOMAIN` | No | `@iiit.ac.in` | Domain suffix for IIIT participant validation |
| `ADMIN_EMAIL` | **Yes** | — | Bootstrap admin email |
| `ADMIN_PASSWORD` | **Yes** | — | Bootstrap admin password |
| `ADMIN_FIRST_NAME` | No | `System` | Admin first name |
| `ADMIN_LAST_NAME` | No | `Administrator` | Admin last name |
| `SMTP_HOST` | No | *(Ethereal)* | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | TLS mode (true = port 465) |
| `SMTP_USER` | No | *(Ethereal)* | SMTP username |
| `SMTP_PASS` | No | *(Ethereal)* | SMTP password / app password |
| `SMTP_FROM` | No | `Felicity Events <noreply@felicity.iiit.ac.in>` | From address |

---

*Built for DASS 2025–26 · IIIT Hyderabad*
