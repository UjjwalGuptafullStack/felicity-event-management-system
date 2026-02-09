/**
 * User Profile Controller
 * 
 * Handles participant profile and preferences management
 * Only participants can access these endpoints
 */

const User = require('../models/User');
const { USER_ROLES } = require('../utils/constants');

/**
 * Get participant profile
 * GET /me/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.actor.id)
      .select('-passwordHash -__v')
      .populate('preferences.followedOrganizers', 'name category');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType,
        collegeOrOrg: user.collegeOrOrg,
        contactNumber: user.contactNumber,
        preferences: {
          interests: user.preferences.interests || [],
          followedOrganizers: user.preferences.followedOrganizers || []
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
};

/**
 * Update participant profile
 * PATCH /me/profile
 * 
 * Editable fields:
 * - firstName, lastName
 * - contactNumber
 * - collegeOrOrg
 * - preferences.interests
 * 
 * Read-only fields:
 * - email
 * - participantType
 * - role
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.actor.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const {
      firstName,
      lastName,
      contactNumber,
      collegeOrOrg,
      interests
    } = req.body;

    // Update allowed fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    if (collegeOrOrg !== undefined) user.collegeOrOrg = collegeOrOrg;
    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return res.status(400).json({
          success: false,
          message: 'Interests must be an array'
        });
      }
      user.preferences.interests = interests;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        contactNumber: user.contactNumber,
        collegeOrOrg: user.collegeOrOrg,
        preferences: {
          interests: user.preferences.interests
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Follow an organizer
 * POST /organizers/:id/follow
 */
const followOrganizer = async (req, res) => {
  try {
    const organizerId = req.params.id;
    const user = await User.findById(req.actor.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if organizer exists and is active
    const Organizer = require('../models/Organizer');
    const organizer = await Organizer.findById(organizerId);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    if (!organizer.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Organizer is not active'
      });
    }

    // Check if already following
    const isFollowing = user.preferences.followedOrganizers.some(
      id => id.toString() === organizerId
    );

    if (isFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Already following this organizer'
      });
    }

    // Add to followed list
    user.preferences.followedOrganizers.push(organizerId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully followed organizer',
      organizer: {
        id: organizer._id,
        name: organizer.name,
        category: organizer.category
      }
    });
  } catch (error) {
    console.error('Follow organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow organizer'
    });
  }
};

/**
 * Unfollow an organizer
 * POST /organizers/:id/unfollow
 */
const unfollowOrganizer = async (req, res) => {
  try {
    const organizerId = req.params.id;
    const user = await User.findById(req.actor.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if following
    const followIndex = user.preferences.followedOrganizers.findIndex(
      id => id.toString() === organizerId
    );

    if (followIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Not following this organizer'
      });
    }

    // Remove from followed list
    user.preferences.followedOrganizers.splice(followIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unfollowed organizer'
    });
  } catch (error) {
    console.error('Unfollow organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow organizer'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  followOrganizer,
  unfollowOrganizer
};
