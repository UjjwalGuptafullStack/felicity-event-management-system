# Deployment

Convene is two independently deployable apps: a static frontend build and a
long-running Node backend. The reference setup below targets Vercel
(frontend) + Render (backend) + MongoDB Atlas, but nothing is Vercel/Render-
specific — any static host + any Node host + any MongoDB instance works.

## Prerequisites

- Node.js 18+
- A MongoDB instance (Atlas free tier is sufficient, or local `mongod`)

## 1. Clone and install

```bash
git clone <repository-url>
cd <repository-directory>

cd backend && npm install
cd ../frontend && npm install
```

## 2. Configure environment variables

Copy `backend/.env.example` to `backend/.env` and fill in real values. At
minimum you need `MONGODB_URI`, `JWT_SECRET`, and `ADMIN_EMAIL`/`ADMIN_PASSWORD`
(the admin account is created automatically on first boot from these — there's
no admin registration endpoint). Everything else has a sane default; see the
comments in `.env.example` for what each variable does, including the
optional `INSTITUTION_NAME`/`INSTITUTION_EMAIL_DOMAINS` pair if you want the
"affiliated participant" distinction enabled for your own institution.

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`
to wherever the backend will be reachable (for local dev, the default
`http://localhost:5000` is fine and this file can be skipped entirely).

## 3. Run locally

```bash
# Terminal 1
cd backend && npm run dev      # http://localhost:5000

# Terminal 2
cd frontend && npm run dev     # http://localhost:5173
```

Socket.io is mounted on the same port as the REST API — no separate process
or port needed. Uploaded chat attachments are served from
`http://localhost:5000/uploads/...` and the `uploads/` directory is created
automatically by Multer on first upload.

Optionally seed demo data (sample clubs + events) with:

```bash
cd backend && npm run seed
```

## 4. Production build

```bash
cd frontend && npm run build   # outputs frontend/dist/ — deploy as a static SPA
cd backend && node server.js   # or your process manager of choice (pm2, systemd, ...)
```

The frontend is a pure SPA — whatever host serves `frontend/dist/` needs a
rewrite rule sending all paths to `index.html` (see `frontend/vercel.json`
for the Vercel version of this rule; adapt for other hosts).

## Reference deployment (Vercel + Render + Atlas)

- **Frontend → Vercel**: point it at `frontend/` as the project root, build
  command `npm run build`, output directory `dist`. Set `VITE_API_BASE_URL`
  to the backend's public URL in the Vercel project's environment variables.
- **Backend → Render** (or any host that runs a long-lived Node process —
  required for Socket.io, which rules out most serverless platforms): point
  it at `backend/`, build command `npm install`, start command `node server.js`.
  Set every variable from `.env.example` in Render's environment settings.
- **Database → MongoDB Atlas**: create a free-tier cluster, whitelist your
  backend host's IP (or `0.0.0.0/0` for simplicity on a demo deployment), and
  use the connection string as `MONGODB_URI`.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `MongooseServerSelectionError` on boot | `MONGODB_URI` wrong, or the backend host's IP isn't whitelisted in Atlas Network Access |
| `FATAL: JWT_SECRET is not defined` | `.env` missing or not loaded — the server fails fast rather than running insecurely |
| `JsonWebTokenError: invalid signature` after a redeploy | `JWT_SECRET` changed while old tokens still exist in browser `localStorage` — clear it and log in again |
| Socket.io connection refused | Backend isn't reachable, or the client has no JWT yet (log in first — the socket handshake requires a token) |
| Chat file upload fails (413) | Multer enforces a 10 MB per-file limit |
