const { z } = require('zod');
const { ORGANIZER_CATEGORIES } = require('../utils/constants');

const registerParticipantSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  participantType: z.string().optional(),
  collegeOrOrg: z.string().trim().optional(),
  contactNumber: z.string().trim().optional()
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required')
});

const createOrganizerSchema = z.object({
  name: z.string().trim().min(1, 'Organizer name is required'),
  category: z.enum(Object.values(ORGANIZER_CATEGORIES)).optional(),
  description: z.string().trim().optional(),
  contactEmail: z.string().trim().toLowerCase().email('A valid contact email is required'),
  contactNumber: z.string().trim().optional()
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  actorType: z.enum(['participant', 'organizer'])
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  actorType: z.enum(['participant', 'organizer']),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

module.exports = {
  registerParticipantSchema,
  loginSchema,
  createOrganizerSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
