/**
 * Password Reset Controller
 * Handles organizer password reset request workflow
 * Tier B1 Feature
 */

const PasswordResetRequest = require('../models/PasswordResetRequest');
const Organizer = require('../models/Organizer');
const { hashPassword } = require('../utils/authHelpers');
const { sendPasswordResetApprovedEmail, sendPasswordResetRejectedEmail } = require('../utils/emailService');
const crypto = require('crypto');

/**
 * Submit password reset request - PUBLIC (No auth required)
 * POST /password-reset/request
 */
const submitPublicResetRequest = async (req, res) => {
  try {
    const { email, reason } = req.body;

    if (!email || !reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email and reason are required'
      });
    }

    // Find organizer by login email
    const organizer = await Organizer.findOne({ loginEmail: email.toLowerCase() });

    if (!organizer) {
      // Don't reveal if email exists or not (security)
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, your request has been submitted.'
      });
    }

    // Check for existing pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizerId: organizer._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request'
      });
    }

    // Create new request
    const resetRequest = new PasswordResetRequest({
      organizerId: organizer._id,
      reason: reason.trim()
    });

    await resetRequest.save();

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted. Please wait for admin approval.',
      request: {
        id: resetRequest._id,
        status: resetRequest.status,
        createdAt: resetRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Submit public reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit password reset request'
    });
  }
};

/**
 * Submit password reset request (Organizer)
 * POST /organizer/password-reset/request
 */
const submitResetRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const organizerId = req.actor.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    // Check for existing pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizerId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request'
      });
    }

    // Create new request
    const resetRequest = new PasswordResetRequest({
      organizerId,
      reason: reason.trim()
    });

    await resetRequest.save();

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted. Please wait for admin approval.',
      request: {
        id: resetRequest._id,
        status: resetRequest.status,
        createdAt: resetRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Submit reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit password reset request'
    });
  }
};

/**
 * Get password reset requests (Admin)
 * GET /admin/password-reset/requests
 */
const getResetRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await PasswordResetRequest.find(filter)
      .populate('organizerId', 'name loginEmail contactEmail')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map(req => ({
        id: req._id,
        organizer: {
          id: req.organizerId._id,
          name: req.organizerId.name,
          loginEmail: req.organizerId.loginEmail,
          contactEmail: req.organizerId.contactEmail
        },
        reason: req.reason,
        status: req.status,
        adminComment: req.adminComment,
        temporaryPassword: req.temporaryPassword,
        resolvedBy: req.resolvedBy ? {
          id: req.resolvedBy._id,
          name: `${req.resolvedBy.firstName} ${req.resolvedBy.lastName}`
        } : null,
        createdAt: req.createdAt,
        resolvedAt: req.resolvedAt
      }))
    });
  } catch (error) {
    console.error('Get reset requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve password reset requests'
    });
  }
};

/**
 * Approve password reset (Admin)
 * POST /admin/password-reset/:id/approve
 */
const approveResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;
    const adminId = req.actor.id;

    const resetRequest = await PasswordResetRequest.findById(id).populate('organizerId');

    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reset request not found'
      });
    }

    if (resetRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Generate new temporary password
    const temporaryPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await hashPassword(temporaryPassword);

    // Update organizer password
    const organizer = resetRequest.organizerId;
    organizer.passwordHash = passwordHash;
    await organizer.save();

    // Update reset request
    resetRequest.status = 'approved';
    resetRequest.adminComment = adminComment;
    resetRequest.newPasswordHash = passwordHash;
    resetRequest.temporaryPassword = temporaryPassword;
    resetRequest.resolvedBy = adminId;
    resetRequest.resolvedAt = new Date();
    await resetRequest.save();

    // Send email with new password to organizer's contact email
    await sendPasswordResetApprovedEmail(organizer, temporaryPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset approved',
      temporaryPassword,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        loginEmail: organizer.loginEmail
      }
    });
  } catch (error) {
    console.error('Approve reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve password reset'
    });
  }
};

/**
 * Reject password reset (Admin)
 * POST /admin/password-reset/:id/reject
 */
const rejectResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;
    const adminId = req.actor.id;

    const resetRequest = await PasswordResetRequest.findById(id).populate('organizerId');

    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reset request not found'
      });
    }

    if (resetRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Update reset request
    resetRequest.status = 'rejected';
    resetRequest.adminComment = adminComment || 'Request rejected by admin';
    resetRequest.resolvedBy = adminId;
    resetRequest.resolvedAt = new Date();
    await resetRequest.save();

    // Send email with rejection reason to organizer's contact email
    await sendPasswordResetRejectedEmail(resetRequest.organizerId, resetRequest.adminComment);

    res.status(200).json({
      success: true,
      message: 'Password reset request rejected',
      request: {
        id: resetRequest._id,
        status: resetRequest.status,
        adminComment: resetRequest.adminComment
      }
    });
  } catch (error) {
    console.error('Reject reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject password reset'
    });
  }
};

/**
 * Get organizer's own reset requests
 * GET /organizer/password-reset/my-requests
 */
const getOwnResetRequests = async (req, res) => {
  try {
    const organizerId = req.actor.id;

    const requests = await PasswordResetRequest.find({ organizerId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map(req => ({
        id: req._id,
        reason: req.reason,
        status: req.status,
        adminComment: req.adminComment,
        temporaryPassword: req.status === 'approved' ? req.temporaryPassword : undefined,
        createdAt: req.createdAt,
        resolvedAt: req.resolvedAt
      }))
    });
  } catch (error) {
    console.error('Get own reset requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reset requests'
    });
  }
};

module.exports = {
  submitPublicResetRequest,
  submitResetRequest,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest,
  getOwnResetRequests
};
