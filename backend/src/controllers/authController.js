/**
 * Authentication Controller
 * Handles registration and login for all actor types
 * 
 * IMPORTANT: Admin accounts can ONLY be created via bootstrap (environment variables).
 * There is NO API endpoint for admin registration for security reasons.
 * Only participants can self-register via API.
 */

const User = require('../models/User');
const Organizer = require('../models/Organizer');
const { USER_ROLES, PARTICIPANT_TYPES, ACTOR_TYPES } = require('../utils/constants');
const {
  hashPassword,
  comparePassword,
  generateToken,
  createUserPayload,
  createOrganizerPayload,
  isInstitutionEmail
} = require('../utils/authHelpers');
const { issuePasswordReset, findValidResetToken } = require('../utils/passwordReset');

/**
 * Register a new participant
 * POST /auth/participant/register
 */
const registerParticipant = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      participantType,
      collegeOrOrg,
      contactNumber
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration data'
      });
    }

    // Determine participant type based on email if not provided
    let finalParticipantType = participantType;
    if (!finalParticipantType) {
      finalParticipantType = isInstitutionEmail(email)
        ? PARTICIPANT_TYPES.AFFILIATED
        : PARTICIPANT_TYPES.GENERAL;
    }

    // Validate participantType matches email domain
    if (finalParticipantType === PARTICIPANT_TYPES.AFFILIATED && !isInstitutionEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'The affiliated participant type requires an institution email domain'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      role: USER_ROLES.PARTICIPANT,
      participantType: finalParticipantType,
      collegeOrOrg,
      contactNumber
    });

    await user.save();

    // Generate token
    const payload = createUserPayload(user);
    const token = generateToken(payload);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType,
        onboardingCompleted: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

/**
 * Login participant
 * POST /auth/participant/login
 */
const loginParticipant = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: USER_ROLES.PARTICIPANT 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const payload = createUserPayload(user);
    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType,
        onboardingCompleted: user.onboardingCompleted || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Login admin
 * POST /auth/admin/login
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: USER_ROLES.ADMIN 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const payload = createUserPayload(user);
    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Login organizer
 * POST /auth/organizer/login
 */
const loginOrganizer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find organizer
    const organizer = await Organizer.findOne({ 
      loginEmail: email.toLowerCase()
    });

    if (!organizer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if organizer is active
    if (!organizer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if organizer has password set
    if (!organizer.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, organizer.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const payload = createOrganizerPayload(organizer);
    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      message: 'Organizer login successful',
      token,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.loginEmail,
        category: organizer.category
      }
    });
  } catch (error) {
    console.error('Organizer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Request a password reset link (participant or organizer).
 * POST /auth/forgot-password
 * Always returns a generic success message so the response can't be used to
 * enumerate registered emails.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email, actorType } = req.body;

    if (!email || !['participant', 'organizer'].includes(actorType)) {
      return res.status(400).json({
        success: false,
        message: 'Email and a valid actorType (participant or organizer) are required'
      });
    }

    const normalizedEmail = email.toLowerCase();
    const genericResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    };

    if (actorType === 'participant') {
      const user = await User.findOne({ email: normalizedEmail, role: USER_ROLES.PARTICIPANT });
      if (user) {
        await issuePasswordReset({
          actorType: ACTOR_TYPES.USER,
          actorId: user._id,
          recipientEmail: user.email,
          recipientName: `${user.firstName} ${user.lastName}`
        });
      }
    } else {
      const organizer = await Organizer.findOne({ loginEmail: normalizedEmail });
      if (organizer) {
        await issuePasswordReset({
          actorType: ACTOR_TYPES.ORGANIZER,
          actorId: organizer._id,
          recipientEmail: organizer.contactEmail,
          recipientName: organizer.name
        });
      }
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process password reset request' });
  }
};

/**
 * Complete a password reset using the token emailed by forgotPassword.
 * POST /auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, actorType, newPassword } = req.body;

    if (!token || !['participant', 'organizer'].includes(actorType) || !newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A valid token and a new password (at least 8 characters) are required'
      });
    }

    const modelActorType = actorType === 'organizer' ? ACTOR_TYPES.ORGANIZER : ACTOR_TYPES.USER;
    const resetToken = await findValidResetToken({ token, actorType: modelActorType });

    if (!resetToken) {
      return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired' });
    }

    const passwordHash = await hashPassword(newPassword);

    if (modelActorType === ACTOR_TYPES.USER) {
      await User.findByIdAndUpdate(resetToken.actorId, { passwordHash });
    } else {
      await Organizer.findByIdAndUpdate(resetToken.actorId, { passwordHash });
    }

    resetToken.used = true;
    await resetToken.save();

    res.status(200).json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

module.exports = {
  registerParticipant,
  loginParticipant,
  loginAdmin,
  loginOrganizer,
  forgotPassword,
  resetPassword
};
