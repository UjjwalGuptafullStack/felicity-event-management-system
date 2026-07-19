# Database

MongoDB via Mongoose. 12 collections, no shared base schema/plugin — each
model is a plain `mongoose.Schema`. No transactions are used anywhere
(cascade deletes are orchestrated in application code — see the note on
`deleteOrganizer` below).

## Entity relationship diagram

```mermaid
erDiagram
    USER ||--o{ REGISTRATION : "registers via"
    USER ||--o{ TEAM : "leads/joins"
    USER ||--o{ FEEDBACK : submits
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ CHAT_MESSAGE : sends
    USER }o--o{ ORGANIZER : follows

    ORGANIZER ||--o{ EVENT : owns
    ORGANIZER ||--o{ NOTIFICATION : receives
    ORGANIZER ||--o{ PASSWORD_RESET_TOKEN : "resets via"

    EVENT ||--o{ REGISTRATION : "registered for"
    EVENT ||--o{ TEAM : "team-registers for"
    EVENT ||--o{ ATTENDANCE : "attendance at"
    EVENT ||--o{ FEEDBACK : "feedback on"
    EVENT ||--o{ DISCUSSION_MESSAGE : "discussed in"

    REGISTRATION ||--o| TICKET : "issues"
    REGISTRATION ||--o{ ATTENDANCE : "checked in via"

    TEAM ||--o{ CHAT_MESSAGE : "chats in"
    TICKET ||--o| ATTENDANCE : "scanned as"

    USER {
        string firstName
        string lastName
        string email UK
        string passwordHash
        string role "participant | admin"
        string participantType "affiliated | general"
        string collegeOrOrg
        object preferences "interests[], followedOrganizers[]"
        boolean onboardingCompleted
    }

    ORGANIZER {
        string name
        string category "enum, see constants.js"
        string contactEmail
        string loginEmail UK
        string passwordHash
        boolean isActive
    }

    EVENT {
        string name
        string type "normal | merchandise"
        string[] categories
        string eligibility
        date registrationDeadline
        date startDate
        date endDate
        number registrationLimit
        number registrationFee
        ObjectId organizerId FK
        string status "draft|published|ongoing|closed"
        object merchandiseDetails "items[].variants[], requiresApproval"
        object teamRegistration "enabled, minSize, maxSize"
    }

    REGISTRATION {
        ObjectId eventId FK
        ObjectId participantId FK
        string registrationType "normal | merchandise"
        string status "registered|cancelled|rejected"
        string paymentStatus "pending|approved|rejected|not_required"
        number totalAmount
    }

    TICKET {
        ObjectId registrationId FK
        string ticketId UK "TKT-hex or MERCH-hex"
        string qrCode UK
        boolean isScanned
    }

    TEAM {
        ObjectId eventId FK
        ObjectId leaderId FK
        string inviteCode
        number maxSize
        string status "forming|complete|cancelled"
    }

    ATTENDANCE {
        ObjectId eventId FK
        ObjectId ticketId FK
        ObjectId registrationId FK
        ObjectId participantId FK
        ObjectId scannedBy FK "Organizer"
        string scanMethod "qr_scan | manual_entry"
    }

    FEEDBACK {
        ObjectId eventId FK
        ObjectId participantId FK
        number rating
        string comment
    }

    DISCUSSION_MESSAGE {
        ObjectId eventId FK
        ObjectId senderId FK
        string senderType "participant | organizer"
        boolean isPinned
        boolean isAnnouncement
        ObjectId parentMessageId FK "self-reference"
    }

    CHAT_MESSAGE {
        ObjectId teamId FK
        ObjectId senderId FK "User"
        string type "text | file"
    }

    NOTIFICATION {
        string recipientType "user | organizer"
        ObjectId recipientId FK
        string type
        string title
        string message
        string link
        boolean read
    }

    PASSWORD_RESET_TOKEN {
        string actorType "user | organizer"
        ObjectId actorId FK
        string tokenHash
        boolean used
        date expiresAt "TTL-indexed"
    }
```

## Notes on specific models

- **`User` vs `Organizer` are separate collections**, not a discriminated
  union — organizers have their own `passwordHash`/`loginEmail` and no
  `role`. This mirrors the actor model in `docs/ARCHITECTURE.md`.
- **`Registration` has two status fields** — a generic `status`
  (registered/cancelled/rejected) and a separate `paymentStatus` used only by
  the merchandise path. This is a known minor schema smell (two parallel
  status fields on one model) rather than a deliberate design choice; splitting
  merchandise registrations into their own model would be the natural fix if
  the merchandise feature grows further.
- **`Event.merchandiseDetails.requiresApproval`** now does what its name
  says: `false` skips the pending-payment step and issues a ticket
  immediately (see `merchandiseController.purchaseMerchandise`); `true`
  (the default) routes through organizer approval as before.
- **Ticket IDs** are consistently `TKT-<16-hex>` for normal-event tickets and
  `MERCH-<16-hex>` for merchandise tickets, generated from `crypto.randomBytes`
  — both paths go through the same `generateTicketId(prefix)` helper in
  `merchandiseController.js` (the equivalent logic in `teamController.js`/
  `participantEventController.js` for normal tickets predates that helper but
  uses the identical format).
- **Cascade delete** (`adminController.deleteOrganizer`) removes an
  organizer's events and everything depending on them (registrations,
  tickets, attendance, feedback, discussion messages, teams,
  password-reset tokens) in application-code order, not a Mongo transaction.
  A crash mid-cascade could leave orphaned records — acceptable at this scale,
  worth revisiting with Mongo transactions if this becomes a
  frequently-invoked admin action in production.
- **Indexes worth knowing about**: `Registration` has a unique compound index
  on `{eventId, participantId}` (no double-registering), `Feedback` the same
  shape, `Attendance` a unique index on `ticketId` (no double-scanning), and
  `PasswordResetToken.expiresAt` is a TTL index — MongoDB deletes expired
  tokens automatically, no cleanup job needed.
