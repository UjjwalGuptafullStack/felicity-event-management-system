import api from './axios';

// Participant Registration & Login
export const registerParticipant = (data) => 
  api.post('/auth/participant/register', data);

export const loginParticipant = (data) => 
  api.post('/auth/participant/login', data);

// Organizer Login
export const loginOrganizer = (data) => 
  api.post('/auth/organizer/login', data);

// Organizer Password Reset (public)
export const requestOrganizerPasswordReset = (data) =>
  api.post('/password-reset/request', data);

// Admin Login
export const loginAdmin = (data) => 
  api.post('/auth/admin/login', data);
