import api from './axios';

// Browse events (participant)
export const browseEvents = (params) => 
  api.get('/participant/events', { params });

// Get event details (participant)
export const getEventDetails = (id) => 
  api.get(`/participant/events/${id}`);

// Alias used in EventDetails page
export const getEventById = (id) =>
  api.get(`/participant/events/${id}`);

// Register for event
export const registerForEvent = (id, data) => 
  api.post(`/participant/events/${id}/register`, data);

// Get my registrations
export const getMyRegistrations = () => 
  api.get('/participant/me/registrations');

// Purchase merchandise
export const purchaseMerchandise = (id, data) => 
  api.post(`/participant/events/${id}/merchandise/purchase`, data);

// Submit feedback
export const submitFeedback = (id, data) => 
  api.post(`/participant/events/${id}/feedback`, data);

// Organizer: Get own events
export const getOrganizerEvents = (params) => 
  api.get('/organizer/events', { params });

// Organizer: Create event
export const createEvent = (data) => 
  api.post('/organizer/events', data);

// Organizer: Get event details
export const getOrganizerEvent = (id) => 
  api.get(`/organizer/events/${id}`);

// Organizer: Update event
export const updateEvent = (id, data) => 
  api.patch(`/organizer/events/${id}`, data);

// Organizer: Publish event
export const publishEvent = (id) => 
  api.post(`/organizer/events/${id}/publish`);

// Organizer: Get event registrations
export const getEventRegistrations = (id) => 
  api.get(`/organizer/events/${id}/registrations`);

// Organizer: Get event feedback
export const getEventFeedback = (id) => 
  api.get(`/organizer/events/${id}/feedback`);

// Organizer: Get feedback stats
export const getFeedbackStats = (id) => 
  api.get(`/organizer/events/${id}/feedback/stats`);

// Aliases for compatibility
export const getAllEvents = browseEvents;
