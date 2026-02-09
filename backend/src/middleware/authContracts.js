/**
 * Authentication and Authorization Middleware
 * 
 * Step 5: RBAC Implementation
 * 
 * Middleware Chain Order (Critical):
 * authenticate → requireActor → requireRole
 * 
 * Authorization Dimensions:
 * 1. Authenticated or not (authenticate)
 * 2. Actor type (requireActor)
 * 3. Role (requireRole - users only)
 */

const { ACTOR_TYPES, USER_ROLES } = require('../utils/constants');
const { verifyToken, isValidPayload } = require('../utils/authHelpers');

/**
 * authenticate()
 * 
 * Purpose: Verify JWT and extract actor identity
 * 
 * Behavior:
 * 1. Extract JWT from Authorization header (Bearer token)
 * 2. Verify JWT signature and expiration
 * 3. Decode payload and validate structure
 * 4. Attach actor info to req.actor = { id, actorType, role? }
 * 5. Call next() on success, return 401 on failure
 * 
 * Does NOT check permissions - only validates identity
 * 
 * Usage: app.use('/api', authenticate)
 */
const authenticate = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Validate payload structure
    if (!isValidPayload(payload)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    // Attach actor to request
    req.actor = {
      id: payload.id,
      actorType: payload.actorType,
      role: payload.role // undefined for organizers
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * requireActor(actorType)
 * 
 * Purpose: Enforce actor type boundary (user vs organizer)
 * 
 * @param {string} actorType - Required actor type ('user' or 'organizer')
 * 
 * Behavior:
 * 1. Check req.actor exists (authenticate must run first)
 * 2. Verify req.actor.actorType matches required type
 * 3. Return 403 if wrong actor type
 * 
 * Critical: Prevents organizers accessing user routes and vice versa
 * 
 * Usage: router.post('/events', authenticate, requireActor(ACTOR_TYPES.ORGANIZER), handler)
 */
const requireActor = (actorType) => {
  return (req, res, next) => {
    if (!req.actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.actor.actorType !== actorType) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
};

/**
 * requireRole(role)
 * 
 * Purpose: Enforce user role (admin vs participant)
 * 
 * @param {string} role - Required user role
 * 
 * Behavior:
 * 1. Check req.actor exists and is a user
 * 2. Verify req.actor.role matches required role
 * 3. Return 403 if wrong role
 * 
 * MUST be used after requireActor(ACTOR_TYPES.USER)
 * Only applicable to users, not organizers
 * 
 * Usage: router.post('/admin/organizers', authenticate, requireActor(ACTOR_TYPES.USER), requireRole(USER_ROLES.ADMIN), handler)
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Must be a user actor (organizers don't have roles)
    if (req.actor.actorType !== ACTOR_TYPES.USER) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Must have required role
    if (req.actor.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * CONVENIENCE FUNCTIONS
 * Built using primitive middleware above for common use cases
 */

/**
 * requireUserRole(allowedRoles)
 * 
 * Convenience function: Checks user actor AND role in one step
 * Equivalent to: requireActor(ACTOR_TYPES.USER) + requireRole check
 * 
 * @param {string[]} allowedRoles - Array of allowed USER_ROLES
 */
const requireUserRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Must be a user actor
    if (req.actor.actorType !== ACTOR_TYPES.USER) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Must have allowed role
    if (!allowedRoles.includes(req.actor.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * requireAdmin()
 * 
 * Convenience: Admin users only
 * Equivalent to: requireActor(ACTOR_TYPES.USER) + requireRole(USER_ROLES.ADMIN)
 * 
 * Usage: router.post('/admin/organizers', authenticate, requireAdmin(), handler)
 */
const requireAdmin = () => {
  return requireUserRole([USER_ROLES.ADMIN]);
};

/**
 * requireOrganizer()
 * 
 * Convenience: Organizer actors only
 * Equivalent to: requireActor(ACTOR_TYPES.ORGANIZER)
 * 
 * Usage: router.post('/events', authenticate, requireOrganizer(), handler)
 */
const requireOrganizer = () => {
  return requireActor(ACTOR_TYPES.ORGANIZER);
};

/**
 * requireParticipant()
 * 
 * Convenience: Participant users only
 * Equivalent to: requireActor(ACTOR_TYPES.USER) + requireRole(USER_ROLES.PARTICIPANT)
 * 
 * Usage: router.post('/registrations', authenticate, requireParticipant(), handler)
 */
const requireParticipant = () => {
  return requireUserRole([USER_ROLES.PARTICIPANT]);
};

module.exports = {
  // Core authentication
  authenticate,
  
  // Primitive authorization (Step 5)
  requireActor,
  requireRole,
  
  // Convenience functions
  requireUserRole,
  requireAdmin,
  requireOrganizer,
  requireParticipant
};