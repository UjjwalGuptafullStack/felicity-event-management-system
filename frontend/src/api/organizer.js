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

// Additional Part 2 APIs
export const getOrganizerEvents = () => api.get('/organizer/events');

export const getOrganizerStats = () => api.get('/organizer/stats');

export const createEvent = (data) => api.post('/organizer/events', data);

export const getPendingMerchandise = () => api.get('/part2/merchandise/pending');

export const approveMerchandise = (purchaseId) => 
  api.put(`/part2/merchandise/${purchaseId}/approve`);

export const rejectMerchandise = (purchaseId) => 
  api.put(`/part2/merchandise/${purchaseId}/reject`);

export const scanQRAttendance = (eventId, qrCode) => 
  api.post(`/part2/attendance/${eventId}/scan`, { qrCode });

export const markManualAttendance = (eventId, participantId) =>
  api.post(`/part2/attendance/${eventId}/manual`, { participantId });

export const getEventAttendance = (eventId) => 
  api.get(`/part2/attendance/${eventId}`);

export const exportAttendance = (eventId) => 
  api.get(`/part2/attendance/${eventId}/export`, { responseType: 'blob' });
