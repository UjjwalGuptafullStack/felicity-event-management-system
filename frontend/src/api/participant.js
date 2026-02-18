import api from './axios';

// Get participant profile
export const getProfile = () => 
  api.get('/participant/me/profile');

// Update profile
export const updateProfile = (data) => 
  api.patch('/participant/me/profile', data);

// Update onboarding preferences (interests + followed organizers)
export const completeOnboarding = (data) =>
  api.patch('/participant/me/profile', { ...data, onboardingCompleted: true });

// Follow organizer
export const followOrganizer = (id) => 
  api.post(`/participant/organizers/${id}/follow`);

// Unfollow organizer
export const unfollowOrganizer = (id) => 
  api.post(`/participant/organizers/${id}/unfollow`);

// List organizers
export const listOrganizers = () => 
  api.get('/participant/organizers');

// Get organizer details
export const getOrganizerDetails = (id) => 
  api.get(`/participant/organizers/${id}`);

// Part 2 APIs
export const getMyMerchandisePurchases = () => 
  api.get('/part2/merchandise/my-purchases');

export const purchaseMerchandise = (data) => 
  api.post('/part2/merchandise/purchase', data);

export const submitFeedback = (data) => 
  api.post('/part2/feedback/submit', data);

export const registerForEvent = (eventId, ticketTypeId) =>
  api.post(`/participant/events/${eventId}/register`, { ticketTypeId });

export const getMyRegistrations = () =>
  api.get('/participant/me/registrations');

export const getParticipantDashboard = () =>
  api.get('/participant/me/dashboard');

// ── Team APIs ──────────────────────────────────────────────────────────────
export const createTeam = (eventId, data) =>
  api.post(`/participant/events/${eventId}/teams`, data);

export const joinTeamByCode = (inviteCode) =>
  api.post('/participant/teams/join', { inviteCode });

export const getMyTeams = () =>
  api.get('/participant/me/teams');

export const getTeamDetail = (teamId) =>
  api.get(`/participant/teams/${teamId}`);

export const cancelTeam = (teamId) =>
  api.delete(`/participant/teams/${teamId}`);

export const leaveTeam = (teamId) =>
  api.post(`/participant/teams/${teamId}/leave`);
