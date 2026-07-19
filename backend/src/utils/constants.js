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

// Participant types - subcategory for participants.
// AFFILIATED = matches a configured institution email domain (see INSTITUTION_EMAIL_DOMAINS),
// GENERAL = everyone else.
const PARTICIPANT_TYPES = {
  AFFILIATED: 'affiliated',
  GENERAL: 'general'
};

// Organizer categories — canonical list. This MUST stay in sync with the mirrored
// list in frontend/src/utils/organizerCategories.js since the two apps are deployed
// separately and can't share a module; the Organizer model enum is generated from
// this list so submitting anything else is rejected at the API boundary.
const ORGANIZER_CATEGORIES = {
  TECHNICAL: 'technical',
  CULTURAL: 'cultural',
  SPORTS: 'sports',
  LITERARY_DEBATE: 'literary-debate',
  GAMING: 'gaming',
  SOCIAL_VOLUNTEER: 'social-volunteer',
  ENTREPRENEURSHIP: 'entrepreneurship',
  MUSIC_FINE_ARTS: 'music-fine-arts',
  MEDIA_PHOTOGRAPHY: 'media-photography',
  OTHER: 'other'
};

const ORGANIZER_CATEGORY_LABELS = {
  technical: 'Technical',
  cultural: 'Cultural',
  sports: 'Sports',
  'literary-debate': 'Literary & Debate',
  gaming: 'Gaming',
  'social-volunteer': 'Social & Volunteer',
  entrepreneurship: 'Entrepreneurship',
  'music-fine-arts': 'Music & Fine Arts',
  'media-photography': 'Media & Photography',
  other: 'Other'
};

// Event types
const EVENT_TYPES = {
  NORMAL: 'normal',
  MERCHANDISE: 'merchandise'
};

// Event categories (multi-select)
const EVENT_CATEGORIES = {
  TECH: 'tech',
  SPORTS: 'sports',
  CULTURAL: 'cultural'
  // Note: 'other' values are stored as custom strings
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

// Team status
const TEAM_STATUS = {
  FORMING: 'forming',
  COMPLETE: 'complete',
  CANCELLED: 'cancelled'
};

module.exports = {
  ACTOR_TYPES,
  USER_ROLES,
  PARTICIPANT_TYPES,
  ORGANIZER_CATEGORIES,
  ORGANIZER_CATEGORY_LABELS,
  EVENT_TYPES,
  EVENT_CATEGORIES,
  EVENT_STATUS,
  REGISTRATION_TYPES,
  REGISTRATION_STATUS,
  TEAM_STATUS
};
