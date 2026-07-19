# Frontend

React 19 + Vite, client-side routing only (no SSR/SSG). Tailwind CSS v4 for
styling, driven by a CSS-custom-property design-token system rather than a
`tailwind.config.js` (v4 is CSS-first config).

## Layout

```
frontend/src/
  main.jsx                   Entry point
  App.jsx                    All routes (React Router v6), role-gated via RoleRoute
  context/
    AuthContext.jsx           Global auth state — actor, token, login()/logout(), persisted to localStorage
  routes/
    ProtectedRoute.jsx        Requires any authenticated actor
    RoleRoute.jsx             Requires a specific actorType/role combination
  layouts/
    ParticipantLayout.jsx     <ParticipantNav/> + <Outlet/>
    OrganizerLayout.jsx       <OrganizerNav/> + <Outlet/>
  pages/
    auth/                     Login (participant/organizer/admin), Register, ForgotPassword, ResetPassword
    participant/              Dashboard, BrowseEvents, EventDetails, Teams, TeamChat, Organizers, Profile, ...
    organizer/                Dashboard, Events, EventDetail, Analytics, MerchandiseApprovals, AttendanceScanner, Profile
    admin/                    Dashboard, ManageOrganizers
  components/
    ParticipantNav.jsx, OrganizerNav.jsx    Per-role top nav (title, links, theme toggle, notification bell, logout)
    ThemeToggle.jsx            Light/dark toggle, persisted to localStorage
    NotificationBell.jsx       Notification dropdown, backed by useNotifications()
    design-system/            EventCard, GradientButton, StatsCard, FloatingActionButton
  hooks/
    useTheme.js               Reads/writes the `.dark` class on <html>
    useNotifications.js        Fetches + subscribes to live notifications over the socket
    useClickOutside.js         Generic outside-click dismissal for dropdowns/modals
  sockets/socket.js            Shared Socket.io client singleton (JWT auth on connect)
  api/                         One axios wrapper module per backend domain (auth, participant, organizer, admin, ...)
  utils/
    organizerCategories.js     Mirrors the backend's ORGANIZER_CATEGORIES — keep in sync, see comment in the file
  config/
    institution.js             Mirrors the backend's INSTITUTION_NAME / INSTITUTION_EMAIL_DOMAINS env vars
  styles/
    theme.css                  Design tokens (light default in :root, dark overrides in .dark) + @layer base typography
    fonts.css                  Applies --font-sans globally; headings override via higher selector specificity
```

## Routing & guards

`App.jsx` defines every route directly (no lazy-loaded route config). Access
control is two nested pieces:

- `ProtectedRoute` — must be *some* authenticated actor.
- `RoleRoute allowedActorType allowedRole` — must be a specific actor type
  (and, for `user` actors, a specific role). Used to gate `/admin/*` to
  `actorType="user" role="admin"`, `/organizer/*` to `actorType="organizer"`, etc.

Both read from `AuthContext`, which itself reads `token`/`actor` from
`localStorage` on load so a refresh doesn't log the user out.

## Design system & theming

`styles/theme.css` defines every design token as a CSS custom property:
colors (`--primary`, `--background`, `--card`, `--muted-foreground`, ...),
a type scale (`--text-xs` → `--text-4xl`), a spacing scale, and a radius
scale. A `@theme inline` block re-exposes these to Tailwind so they're usable
as ordinary utility classes (`bg-card`, `text-foreground`, `rounded-xl`).

**Light is the default; dark is opt-in via a `.dark` class on `<html>`.**
`useTheme()` toggles that class and persists the choice (`convene-theme` in
localStorage), falling back to `prefers-color-scheme` on first load.
Components should always use the semantic tokens (`bg-card`,
`text-muted-foreground`) rather than raw Tailwind colors (`bg-white`,
`text-gray-600`) — that's what makes the whole app re-theme for free.

### Typography hierarchy

Two font families carry the hierarchy, not just size:

- **Sora** (`--font-display`) — headings `h1`–`h4`, weight 800→600 descending.
- **Inter** (`--font-sans`) — body text, labels, buttons, inputs.

Both are loaded via Google Fonts in `index.html`. This used to be broken: a
leftover `fonts.css` rule forced `* { font-family: Consolas, monospace }`
across the entire app, so Inter was loaded over the network and never
actually rendered. That's fixed — see `styles/fonts.css`'s current (much
smaller) contents and the `@layer base` heading rules in `theme.css`.

### Chart colors

`--chart-1` through `--chart-5` are a fixed-order categorical palette,
validated for colorblind-safety (see the `dataviz` methodology this project's
Analytics page follows: assign hues in a fixed order, never cycle past 5 —
fold overflow categories into "Other"). Don't reorder them per-chart; a given
slot should mean the same thing everywhere it's used.

## Realtime

`sockets/socket.js` exports a singleton `getSocket()` that connects once
(JWT from `localStorage` passed via the handshake `auth` payload) and is
reused by both team chat (`TeamChat.jsx`) and `useNotifications.js`. The
backend auto-joins every connected actor to a personal room, so
`useNotifications` just listens for `notification:new` — no explicit
subscribe step needed for that channel (team chat rooms are still
explicitly joined/left per team).

## Institution & organizer-category config

Two small config modules mirror backend env-driven constants so the frontend
never hardcodes an institution or a stale category list:

- `config/institution.js` — `VITE_INSTITUTION_NAME` / `VITE_INSTITUTION_EMAIL_DOMAINS`
- `utils/organizerCategories.js` — the canonical category slug→label list

If you change the backend's `ORGANIZER_CATEGORIES` (`backend/src/utils/constants.js`),
update this file too — see the comment in both files.
