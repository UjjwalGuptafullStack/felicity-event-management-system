import api from './axios';

// Get admin dashboard
export const getAdminDashboard = () => 
  api.get('/admin/dashboard');

// Create organizer
export const createOrganizer = (data) => 
  api.post('/admin/organizers', data);

// Get organizers list
export const getOrganizers = () => 
  api.get('/admin/organizers');

// Get organizer details
export const getOrganizer = (id) => 
  api.get(`/admin/organizers/${id}`);

// Disable organizer
export const disableOrganizer = (id) => 
  api.patch(`/admin/organizers/${id}/disable`);

// Enable organizer
export const enableOrganizer = (id) => 
  api.patch(`/admin/organizers/${id}/enable`);

// Delete organizer permanently
export const deleteOrganizer = (id) =>
  api.delete(`/admin/organizers/${id}`);

// Get password reset requests
export const getPasswordResetRequests = (params) => 
  api.get('/admin/password-reset/requests', { params });

// (Password reset functions moved to Part 2 section below)

// Additional Part 2 APIs
export const getAdminStats = () => api.get('/admin/stats');

export const getAllOrganizers = () => api.get('/admin/organizers');

export const approveOrganizer = (organizerId) =>
  api.put(`/admin/organizers/${organizerId}/approve`);

export const suspendOrganizer = (organizerId) =>
  api.put(`/admin/organizers/${organizerId}/suspend`);

// Password Reset Requests for Organizers
export const getPendingPasswordResets = () => 
  api.get('/admin/password-reset/requests', { params: { status: 'pending' } });

export const approvePasswordReset = (requestId) =>
  api.post(`/admin/password-reset/${requestId}/approve`);

export const rejectPasswordReset = (requestId, adminComment) =>
  api.post(`/admin/password-reset/${requestId}/reject`, { adminComment });
