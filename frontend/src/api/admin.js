import api from './axios';

// Get admin dashboard
export const getAdminDashboard = () =>
  api.get('/admin/dashboard');

export const getAdminStats = () => api.get('/admin/stats');

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

// Send a self-service password reset link to an organizer
export const resetOrganizerPassword = (id) =>
  api.post(`/admin/organizers/${id}/reset-password`);
