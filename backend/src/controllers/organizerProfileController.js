/**
 * Organizer Profile Controller
 * 
 * Handles organizer profile management
 */

const Organizer = require('../models/Organizer');

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
      profile: {
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
      profile: {
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

module.exports = {
  getOrganizerProfile,
  updateOrganizerProfile
};
