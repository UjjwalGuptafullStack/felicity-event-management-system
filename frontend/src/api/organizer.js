import api from './axios';

// Get organizer profile
export const getOrganizerProfile = () =>
  api.get('/organizer/profile');

// Update organizer profile
export const updateOrganizerProfile = (data) =>
  api.patch('/organizer/profile', data);

// Change password while logged in (current + new password)
export const changeOrganizerPassword = (data) =>
  api.post('/organizer/me/change-password', data);

// Events
export const getOrganizerEvents = () => api.get('/organizer/events');

export const getOrganizerDashboard = () => api.get('/organizer/dashboard');

export const getOrganizerEvent = (eventId) => api.get(`/organizer/events/${eventId}`);

export const getEventRegistrations = (eventId) => api.get(`/organizer/events/${eventId}/registrations`);

export const createEvent = (data) => api.post('/organizer/events', data);

export const updateEvent = (eventId, data) => api.patch(`/organizer/events/${eventId}`, data);

export const publishEvent = (eventId) => api.post(`/organizer/events/${eventId}/publish`);

export const closeEventRegistrations = (eventId) => api.post(`/organizer/events/${eventId}/close-registrations`);

export const getEventAnalytics = (eventId) => api.get(`/organizer/events/${eventId}/analytics`);

export const getOrganizerAnalyticsOverview = () => api.get('/organizer/analytics/overview');

export const exportEventRegistrations = (eventId) =>
  api.get(`/organizer/events/${eventId}/registrations/export`, { responseType: 'blob' });

// Feedback
export const getEventFeedback = (eventId) => api.get(`/organizer/events/${eventId}/feedback`);

export const getEventFeedbackStats = (eventId) => api.get(`/organizer/events/${eventId}/feedback/stats`);

export const exportFeedbackCSV = (eventId) =>
  api.get(`/organizer/events/${eventId}/feedback/export`, { responseType: 'blob' });

// Merchandise approvals
export const getPendingMerchandise = () => api.get('/organizer/merchandise/pending');

export const approveMerchandise = (regId) =>
  api.post(`/organizer/merchandise/${regId}/approve`);

export const rejectMerchandise = (regId) =>
  api.post(`/organizer/merchandise/${regId}/reject`);

// Attendance
export const scanQRAttendance = (eventId, qrCode) =>
  api.post(`/organizer/events/${eventId}/attendance/scan`, { qrCode });

export const markManualAttendance = (eventId, participantEmail, remarks = '') =>
  api.post(`/organizer/events/${eventId}/attendance/manual`, { participantEmail, remarks });

export const getEventAttendance = (eventId) =>
  api.get(`/organizer/events/${eventId}/attendance`);

export const exportAttendance = (eventId) =>
  api.get(`/organizer/events/${eventId}/attendance/export`, { responseType: 'blob' });
