import api from './axios';

// Post message
export const postMessage = (eventId, data) => 
  api.post(`/events/${eventId}/discussion/messages`, data);

// Get messages
export const getMessages = (eventId, params) => 
  api.get(`/events/${eventId}/discussion/messages`, { params });

// Pin message (organizer)
export const pinMessage = (eventId, messageId) => 
  api.post(`/organizer/events/${eventId}/discussion/messages/${messageId}/pin`);

// Unpin message (organizer)
export const unpinMessage = (eventId, messageId) => 
  api.post(`/organizer/events/${eventId}/discussion/messages/${messageId}/unpin`);

// Delete message (organizer)
export const deleteMessage = (eventId, messageId) => 
  api.delete(`/organizer/events/${eventId}/discussion/messages/${messageId}`);

// Post announcement (organizer)
export const postAnnouncement = (eventId, data) => 
  api.post(`/organizer/events/${eventId}/discussion/announcement`, data);
