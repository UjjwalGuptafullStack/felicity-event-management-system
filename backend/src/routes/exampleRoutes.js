/**
 * Example Routes - Authorization Patterns
 * 
 * This file demonstrates correct authorization middleware usage
 * for different actor types and roles
 * 
 * DO NOT connect these routes to server yet - they're examples only
 */

const express = require('express');
const router = express.Router();
const { ACTOR_TYPES, USER_ROLES } = require('../utils/constants');
const {
  authenticate,
  requireActor,
  requireRole,
  requireAdmin,
  requireParticipant,
  requireOrganizer
} = require('../middleware/authContracts');

/**
 * PATTERN 1: PUBLIC ROUTES
 * No authentication required
 */

// Anyone can view public event list
router.get('/events/public', (req, res) => {
  res.json({ message: 'Public events list' });
});

/**
 * PATTERN 2: AUTHENTICATED (ANY ACTOR)
 * Just need valid JWT, don't care about type/role
 */

// Any authenticated actor can view their own profile
router.get('/profile', authenticate, (req, res) => {
  // req.actor is available but we don't filter by type
  res.json({ 
    id: req.actor.id,
    actorType: req.actor.actorType,
    role: req.actor.role 
  });
});

/**
 * PATTERN 3: PARTICIPANT ONLY
 * User actor + participant role
 */

// Only participants can browse events
router.get('/events',
  authenticate,
  requireParticipant(),
  (req, res) => {
    res.json({ message: 'Browse events (participant only)' });
  }
);

// Only participants can register for events
router.post('/registrations',
  authenticate,
  requireParticipant(),
  (req, res) => {
    res.json({ message: 'Register for event (participant only)' });
  }
);

// Only participants can view their registrations
router.get('/my-registrations',
  authenticate,
  requireParticipant(),
  (req, res) => {
    res.json({ message: 'My registrations (participant only)' });
  }
);

/**
 * PATTERN 4: ADMIN ONLY
 * User actor + admin role
 */

// Only admins can create organizers
router.post('/admin/organizers',
  authenticate,
  requireAdmin(),
  (req, res) => {
    res.json({ message: 'Create organizer (admin only)' });
  }
);

// Only admins can disable organizers
router.patch('/admin/organizers/:id/disable',
  authenticate,
  requireAdmin(),
  (req, res) => {
    res.json({ message: 'Disable organizer (admin only)' });
  }
);

// Only admins can create admin users
router.post('/admin/users',
  authenticate,
  requireAdmin(),
  (req, res) => {
    res.json({ message: 'Create admin user (admin only)' });
  }
);

/**
 * PATTERN 5: ORGANIZER ONLY
 * Organizer actor type
 */

// Only organizers can create events
router.post('/events',
  authenticate,
  requireOrganizer(),
  (req, res) => {
    res.json({ message: 'Create event (organizer only)' });
  }
);

// Only organizers can edit events (with ownership check in controller)
router.put('/events/:id',
  authenticate,
  requireOrganizer(),
  (req, res) => {
    // Controller would check: ownsEvent(req.actor, event)
    res.json({ message: 'Edit event (organizer only, ownership checked in controller)' });
  }
);

// Only organizers can view registrations (with ownership check in controller)
router.get('/events/:id/registrations',
  authenticate,
  requireOrganizer(),
  (req, res) => {
    // Controller would check: ownsEvent(req.actor, event)
    res.json({ message: 'View registrations (organizer only, own events only)' });
  }
);

/**
 * PATTERN 6: MIXED USER ACCESS
 * Any user (admin OR participant), but not organizer
 */

// Both admins and participants can view organizer directory
router.get('/organizers',
  authenticate,
  requireActor(ACTOR_TYPES.USER),  // Any user role
  (req, res) => {
    res.json({ message: 'View organizers (admin or participant)' });
  }
);

/**
 * PATTERN 7: USING PRIMITIVES (EXPLICIT)
 * Same as convenience functions but more explicit
 */

// Explicit admin check using primitives
router.post('/admin/system-config',
  authenticate,
  requireActor(ACTOR_TYPES.USER),
  requireRole(USER_ROLES.ADMIN),
  (req, res) => {
    res.json({ message: 'Update system config (admin - explicit)' });
  }
);

// Explicit participant check using primitives
router.post('/feedback',
  authenticate,
  requireActor(ACTOR_TYPES.USER),
  requireRole(USER_ROLES.PARTICIPANT),
  (req, res) => {
    res.json({ message: 'Submit feedback (participant - explicit)' });
  }
);

/**
 * AUTHORIZATION NOTES:
 * 
 * 1. Middleware Order:
 *    authenticate → requireActor → requireRole
 * 
 * 2. Convenience vs Primitives:
 *    - requireAdmin() === requireActor(USER) + requireRole(ADMIN)
 *    - requireParticipant() === requireActor(USER) + requireRole(PARTICIPANT)
 *    - requireOrganizer() === requireActor(ORGANIZER)
 * 
 * 3. Ownership Checks:
 *    - Middleware handles role/actor type
 *    - Controllers handle ownership (e.g., organizer owns event)
 * 
 * 4. Error Codes:
 *    - 401: Not authenticated (no/invalid token)
 *    - 403: Not authorized (wrong actor type, role, or ownership)
 */

module.exports = router;
