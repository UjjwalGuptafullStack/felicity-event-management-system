/**
 * Organizer Profile Controller
 * 
 * Handles organizer profile management
 */

const Organizer = require('../models/Organizer');
const { comparePassword, hashPassword } = require('../utils/authHelpers');

/**
 * Get organizer profile
 * GET /organizer/profile
 */
const getOrganizerProfile = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.actor.id)
      .select('-passwordHash -__v');

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    res.status(200).json({
      success: true,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        category: organizer.category,
        description: organizer.description,
        contactEmail: organizer.contactEmail,
        contactNumber: organizer.contactNumber,
        loginEmail: organizer.loginEmail,
        isActive: organizer.isActive,
        createdAt: organizer.createdAt
      }
    });
  } catch (error) {
    console.error('Get organizer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
};

/**
 * Update organizer profile
 * PATCH /organizer/profile
 * 
 * Editable fields:
 * - name
 * - category
 * - description
 * - contactEmail
 * - contactNumber
 * 
 * Read-only:
 * - loginEmail
 * - isActive
 */
const updateOrganizerProfile = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.actor.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    const {
      name,
      category,
      description,
      contactEmail,
      contactNumber
    } = req.body;

    // Update allowed fields
    if (name !== undefined) organizer.name = name;
    if (category !== undefined) organizer.category = category;
    if (description !== undefined) organizer.description = description;
    if (contactEmail !== undefined) organizer.contactEmail = contactEmail;
    if (contactNumber !== undefined) organizer.contactNumber = contactNumber;

    await organizer.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      organizer: {
        id: organizer._id,
        name: organizer.name,
        category: organizer.category,
        description: organizer.description,
        contactEmail: organizer.contactEmail,
        contactNumber: organizer.contactNumber
      }
    });
  } catch (error) {
    console.error('Update organizer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Change organizer password
 * POST /organizer/me/change-password
 */
const changeOrganizerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    const organizer = await Organizer.findById(req.actor.id);
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, organizer.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash and save new password
    organizer.passwordHash = await hashPassword(newPassword);
    await organizer.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change organizer password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

module.exports = {
  getOrganizerProfile,
  updateOrganizerProfile,
  changeOrganizerPassword
};
