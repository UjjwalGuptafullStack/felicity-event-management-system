/**
 * System-wide constants for roles, actor types, and enums
 * These ensure consistency across authentication, authorization, and business logic
 */

// Actor types - represents different identity classes in the system
const ACTOR_TYPES = {
  USER: 'user',           // Participants and Admins
  ORGANIZER: 'organizer'  // Event organizers
};

// User roles - only applicable to User collection
const USER_ROLES = {
  PARTICIPANT: 'participant',
  ADMIN: 'admin'
};

// Participant types - subcategory for participants
const PARTICIPANT_TYPES = {
  IIIT: 'iiit',
  NON_IIIT: 'non-iiit'
};

// Event types
const EVENT_TYPES = {
  NORMAL: 'normal',
  MERCHANDISE: 'merchandise'
};

// Event status
const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  CLOSED: 'closed'
};

// Registration types
const REGISTRATION_TYPES = {
  NORMAL: 'normal',
  MERCHANDISE: 'merchandise'
};

// Registration status
const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

module.exports = {
  ACTOR_TYPES,
  USER_ROLES,
  PARTICIPANT_TYPES,
  EVENT_TYPES,
  EVENT_STATUS,
  REGISTRATION_TYPES,
  REGISTRATION_STATUS
};
