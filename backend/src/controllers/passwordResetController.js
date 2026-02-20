/**
 * Password Reset Controller
 * Handles organizer password reset request workflow
 * Tier B1 Feature
 */

const PasswordResetRequest = require('../models/PasswordResetRequest');
const Organizer = require('../models/Organizer');
const { hashPassword } = require('../utils/authHelpers');
const {
  sendPasswordResetApprovedEmail,
  sendPasswordResetRejectedEmail,
  sendPasswordResetApprovalGrantedEmail
} = require('../utils/emailService');
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
      status: { $in: ['pending', 'approved'] }
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
      reason: reason.trim(),
      type: 'forgot_password'
    });

    await resetRequest.save();

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted. Please wait for admin approval.',
      request: {
        id: resetRequest._id,
        status: resetRequest.status,
        type: resetRequest.type,
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
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: existingRequest.status === 'approved'
          ? 'Your request has already been approved. Check your registered email for the new temporary password.'
          : 'You already have a pending password reset request'
      });
    }

    // Create new request – admin will generate a new password upon approval
    const resetRequest = new PasswordResetRequest({
      organizerId,
      reason: reason.trim(),
      type: 'forgot_password'
    });

    await resetRequest.save();

    res.status(201).json({
      success: true,
      message: 'Password change request submitted. Please wait for admin approval.',
      request: {
        id: resetRequest._id,
        status: resetRequest.status,
        type: resetRequest.type,
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
        type: req.type,
        status: req.status,
        adminComment: req.adminComment,
        temporaryPassword: req.type === 'forgot_password' && req.status === 'approved'
          ? req.temporaryPassword
          : undefined,
        resolvedBy: req.resolvedBy ? {
          id: req.resolvedBy._id,
          name: `${req.resolvedBy.firstName} ${req.resolvedBy.lastName}`
        } : null,
        createdAt: req.createdAt,
        resolvedAt: req.resolvedAt,
        completedAt: req.completedAt
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

    const organizer = resetRequest.organizerId;

    if (resetRequest.type === 'forgot_password') {
      // Generate and immediately set a temporary password
      const temporaryPassword = crypto.randomBytes(8).toString('hex');
      const passwordHash = await hashPassword(temporaryPassword);

      organizer.passwordHash = passwordHash;
      await organizer.save();

      resetRequest.status = 'approved';
      resetRequest.adminComment = adminComment;
      resetRequest.newPasswordHash = passwordHash;
      resetRequest.temporaryPassword = temporaryPassword;
      resetRequest.resolvedBy = adminId;
      resetRequest.resolvedAt = new Date();
      await resetRequest.save();

      await sendPasswordResetApprovedEmail(organizer, temporaryPassword);

      return res.status(200).json({
        success: true,
        message: 'Password reset approved – temporary password generated and emailed to organizer.',
        type: 'forgot_password',
        temporaryPassword,
        organizer: { id: organizer._id, name: organizer.name, loginEmail: organizer.loginEmail }
      });
    }

    // self_change – grant permission; organizer sets their own password
    resetRequest.status = 'approved';
    resetRequest.adminComment = adminComment;
    resetRequest.resolvedBy = adminId;
    resetRequest.resolvedAt = new Date();
    await resetRequest.save();

    // Notify organizer that they can now log in and set their password
    try {
      await sendPasswordResetApprovalGrantedEmail(organizer, adminComment);
    } catch (emailErr) {
      console.warn('Approval-granted email failed (non-fatal):', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Password change request approved – organizer can now set their new password.',
      type: 'self_change',
      organizer: { id: organizer._id, name: organizer.name, loginEmail: organizer.loginEmail }
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
        type: req.type,
        status: req.status,
        adminComment: req.adminComment,
        temporaryPassword: req.type === 'forgot_password' && req.status === 'approved'
          ? req.temporaryPassword
          : undefined,
        canSetNewPassword: req.type === 'self_change' && req.status === 'approved',
        createdAt: req.createdAt,
        resolvedAt: req.resolvedAt,
        completedAt: req.completedAt
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

/**
 * Complete password change (Organizer – self_change flow)
 * Organizer has an approved request and now sets their new password.
 * POST /organizer/password-reset/:id/complete
 */
const completePasswordChange = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const organizerId = req.actor.id;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const resetRequest = await PasswordResetRequest.findById(id).populate('organizerId');

    if (!resetRequest) {
      return res.status(404).json({ success: false, message: 'Reset request not found' });
    }

    if (resetRequest.organizerId._id.toString() !== organizerId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (resetRequest.type !== 'self_change') {
      return res.status(400).json({ success: false, message: 'Invalid request type for this operation' });
    }

    if (resetRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: resetRequest.status === 'pending'
          ? 'Your request is still awaiting admin approval'
          : 'This request cannot be used to change your password'
      });
    }

    const organizer = resetRequest.organizerId;
    organizer.passwordHash = await hashPassword(newPassword);
    await organizer.save();

    resetRequest.status = 'completed';
    resetRequest.completedAt = new Date();
    await resetRequest.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Complete password change error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
};

module.exports = {
  submitPublicResetRequest,
  submitResetRequest,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest,
  completePasswordChange,
  getOwnResetRequests
};
