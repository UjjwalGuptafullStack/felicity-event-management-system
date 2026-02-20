import api from './axios';

export const getChatMessages = (teamId, { before, limit = 50 } = {}) => {
  const params = { limit };
  if (before) params.before = before;
  return api.get(`/chat/team/${teamId}/messages`, { params });
};

export const uploadChatFile = (teamId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/chat/team/${teamId}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
