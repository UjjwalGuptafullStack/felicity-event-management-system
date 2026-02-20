import api from './axios';

// Get pending merchandise payments
export const getPendingPayments = () => 
  api.get('/organizer/merchandise/pending');

// Approve payment
export const approvePayment = (regId) => 
  api.post(`/organizer/merchandise/${regId}/approve`);

// Reject payment
export const rejectPayment = (regId, data) => 
  api.post(`/organizer/merchandise/${regId}/reject`, data);

// Scan QR code
export const scanQRCode = (eventId, data) => 
  api.post(`/organizer/events/${eventId}/attendance/scan`, data);

// Manual attendance entry
export const manualAttendance = (eventId, data) => 
  api.post(`/organizer/events/${eventId}/attendance/manual`, data);

// Get attendance list
export const getAttendanceList = (eventId) => 
  api.get(`/organizer/events/${eventId}/attendance`);

// Export attendance CSV (moved to Part 2 section below)

// Submit password reset request
export const submitPasswordReset = (data) => 
  api.post('/organizer/password-reset/request', data);

// Get own reset requests
export const getOwnResetRequests = () => 
  api.get('/organizer/password-reset/my-requests');

// Get organizer profile
export const getOrganizerProfile = () => 
  api.get('/organizer/profile');

// Update organizer profile
export const updateOrganizerProfile = (data) => 
  api.patch('/organizer/profile', data);

// Change organizer password via admin-approved request
export const completePasswordChange = (requestId, newPassword) =>
  api.post(`/organizer/password-reset/${requestId}/complete`, { newPassword });

// Additional Part 2 APIs
export const getOrganizerEvents = () => api.get('/organizer/events');

export const getOrganizerDashboard = () => api.get('/organizer/dashboard');

export const getOrganizerEvent = (eventId) => api.get(`/organizer/events/${eventId}`);

export const getEventRegistrations = (eventId) => api.get(`/organizer/events/${eventId}/registrations`);

export const createEvent = (data) => api.post('/organizer/events', data);

export const updateEvent = (eventId, data) => api.patch(`/organizer/events/${eventId}`, data);

export const publishEvent = (eventId) => api.post(`/organizer/events/${eventId}/publish`);

export const closeEventRegistrations = (eventId) => api.post(`/organizer/events/${eventId}/close-registrations`);

export const getEventAnalytics = (eventId) => api.get(`/organizer/events/${eventId}/analytics`);

export const getEventFeedback = (eventId) => api.get(`/organizer/events/${eventId}/feedback`);

export const getEventFeedbackStats = (eventId) => api.get(`/organizer/events/${eventId}/feedback/stats`);

export const exportFeedbackCSV = (eventId) =>
  api.get(`/organizer/events/${eventId}/feedback/export`, { responseType: 'blob' });

export const getPendingMerchandise = () => api.get('/part2/merchandise/pending');

export const approveMerchandise = (purchaseId) => 
  api.put(`/part2/merchandise/${purchaseId}/approve`);

export const rejectMerchandise = (purchaseId) => 
  api.put(`/part2/merchandise/${purchaseId}/reject`);

// Correct attendance API calls (aliases for backward compat)
export const scanQRAttendance = (eventId, qrCode) => 
  api.post(`/organizer/events/${eventId}/attendance/scan`, { qrCode });

export const markManualAttendance = (eventId, participantEmail, remarks = '') =>
  api.post(`/organizer/events/${eventId}/attendance/manual`, { participantEmail, remarks });

export const getEventAttendance = (eventId) => 
  api.get(`/organizer/events/${eventId}/attendance`);

export const exportAttendance = (eventId) => 
  api.get(`/organizer/events/${eventId}/attendance/export`, { responseType: 'blob' });
