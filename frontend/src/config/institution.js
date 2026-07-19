// Mirrors the backend's INSTITUTION_NAME / INSTITUTION_EMAIL_DOMAINS env vars
// (see backend/src/config/env.js). Keep these two in sync — the frontend can't
// import backend code directly since they're deployed separately.
export const INSTITUTION_NAME = import.meta.env.VITE_INSTITUTION_NAME || 'Your Institution';

export const INSTITUTION_EMAIL_DOMAINS = (import.meta.env.VITE_INSTITUTION_EMAIL_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export const HAS_INSTITUTION_DOMAINS = INSTITUTION_EMAIL_DOMAINS.length > 0;
