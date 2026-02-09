/**
 * Access Control Rules and Ownership Checks
 * 
 * This file documents the authorization matrix and provides
 * ownership validation utilities for controller-level checks
 */

const { ACTOR_TYPES, USER_ROLES } = require('./constants');

/**
 * AUTHORIZATION MATRIX
 * 
 * Defines what each actor type can do
 * ✅ = Allowed  ❌ = Forbidden
 * 
 * | Feature                  | Participant | Organizer | Admin |
 * |--------------------------|-------------|-----------|-------|
 * | Browse events            | ✅           | ❌         | ❌     |
 * | View event details       | ✅           | ✅         | ✅     |
 * | Register for event       | ✅           | ❌         | ❌     |
 * | View own registrations   | ✅           | ❌         | ❌     |
 * | Cancel registration      | ✅           | ❌         | ❌     |
 * | Follow organizers        | ✅           | ❌         | ❌     |
 * | Create event             | ❌           | ✅         | ❌     |
 * | Edit own event           | ❌           | ✅         | ❌     |
 * | Delete own event         | ❌           | ✅         | ❌     |
 * | View event registrations | ❌           | ✅ (own)   | ❌     |
 * | Create organizer         | ❌           | ❌         | ✅     |
 * | Disable organizer        | ❌           | ❌         | ✅     |
 * | View all organizers      | ✅           | ❌         | ✅     |
 * | Create admin user        | ❌           | ❌         | ✅     |
 */

/**
 * Check if actor is a participant
 * @param {Object} actor - req.actor from middleware
 * @returns {boolean}
 */
const isParticipant = (actor) => {
  return actor && 
         actor.actorType === ACTOR_TYPES.USER && 
         actor.role === USER_ROLES.PARTICIPANT;
};

/**
 * Check if actor is an admin
 * @param {Object} actor - req.actor from middleware
 * @returns {boolean}
 */
const isAdmin = (actor) => {
  return actor && 
         actor.actorType === ACTOR_TYPES.USER && 
         actor.role === USER_ROLES.ADMIN;
};

/**
 * Check if actor is an organizer
 * @param {Object} actor - req.actor from middleware
 * @returns {boolean}
 */
const isOrganizer = (actor) => {
  return actor && actor.actorType === ACTOR_TYPES.ORGANIZER;
};

/**
 * OWNERSHIP CHECKS
 * These are used in controllers, not middleware
 * Middleware handles role/actor type, controllers handle ownership
 */

/**
 * Check if organizer owns an event
 * @param {Object} actor - req.actor from middleware
 * @param {Object} event - Event document from database
 * @returns {boolean}
 */
const ownsEvent = (actor, event) => {
  if (!isOrganizer(actor)) {
    return false;
  }
  
  return event.organizerId.toString() === actor.id;
};

/**
 * Check if user owns a registration
 * @param {Object} actor - req.actor from middleware
 * @param {Object} registration - Registration document from database
 * @returns {boolean}
 */
const ownsRegistration = (actor, registration) => {
  if (!isParticipant(actor)) {
    return false;
  }
  
  return registration.participantId.toString() === actor.id;
};

/**
 * Check if actor can view event registrations
 * Admin = all events
 * Organizer = only their own events
 * Participant = cannot view
 * 
 * @param {Object} actor - req.actor from middleware
 * @param {Object} event - Event document from database
 * @returns {boolean}
 */
const canViewEventRegistrations = (actor, event) => {
  if (isAdmin(actor)) {
    return true; // Admin sees all
  }
  
  if (isOrganizer(actor)) {
    return ownsEvent(actor, event); // Organizer sees only their events
  }
  
  return false; // Participants cannot view registrations
};

/**
 * Check if actor can modify an organizer
 * Only admins can create/disable organizers
 * 
 * @param {Object} actor - req.actor from middleware
 * @returns {boolean}
 */
const canModifyOrganizer = (actor) => {
  return isAdmin(actor);
};

/**
 * Generate ownership error response
 * @returns {Object} Standard error response
 */
const ownershipDenied = () => {
  return {
    success: false,
    message: 'Access denied'
  };
};

module.exports = {
  // Actor type checks
  isParticipant,
  isAdmin,
  isOrganizer,
  
  // Ownership validators
  ownsEvent,
  ownsRegistration,
  canViewEventRegistrations,
  canModifyOrganizer,
  
  // Response helpers
  ownershipDenied
};
