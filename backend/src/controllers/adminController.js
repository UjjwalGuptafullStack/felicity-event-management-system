/**
 * Admin Controller
 * 
 * Handles admin-only operations:
 * - Organizer provisioning (create)
 * - Organizer management (disable, list)
 * 
 * All routes protected by requireAdmin middleware
 */

const crypto = require('crypto');
const Organizer = require('../models/Organizer');
const { hashPassword } = require('../utils/authHelpers');

/**
 * Generate random password for new organizer
 * @returns {string} Random password
 */
const generateTemporaryPassword = () => {
  return crypto.randomBytes(8).toString('hex'); // 16 character hex string
};

/**
 * Generate login email from organizer name
 * @param {string} name - Organizer name
 * @returns {string} Login email
 */
const generateLoginEmail = (name) => {
  // Convert to lowercase, replace spaces with dots, remove special chars
  const sanitized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
  
  return `${sanitized}@organizer.felicity.iiit.ac.in`;
};

/**
 * Create new organizer
 * POST /admin/organizers
 * 
 * Only admin can create organizers
 * No self-registration for organizers
 */
const createOrganizer = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      contactEmail,
      contactNumber
    } = req.body;

    // Validation
    if (!name || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Organizer name and contact email are required'
      });
    }

    // Auto-generate login credentials
    const loginEmail = generateLoginEmail(name);
    const temporaryPassword = generateTemporaryPassword();

    // Check if loginEmail already exists
    const existingOrganizer = await Organizer.findOne({ loginEmail });
    if (existingOrganizer) {
      return res.status(400).json({
        success: false,
        message: 'An organizer with this name already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(temporaryPassword);

    // Create organizer
    const organizer = new Organizer({
      name,
      category,
      description,
      contactEmail,
      contactNumber,
      loginEmail,
      passwordHash,
      isActive: true
    });

    await organizer.save();

    // Return organizer details with temporary credentials
    // Admin must manually share these with organizer
    res.status(201).json({
      success: true,
      message: 'Organizer created successfully',
      organizer: {
        id: organizer._id,
        name: organizer.name,
        category: organizer.category,
        contactEmail: organizer.contactEmail,
        loginEmail: organizer.loginEmail,
        isActive: organizer.isActive,
        createdAt: organizer.createdAt
      },
      credentials: {
        loginEmail: organizer.loginEmail,
        temporaryPassword: temporaryPassword,
        note: 'Share these credentials with the organizer securely. Password should be changed after first login.'
      }
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create organizer'
    });
  }
};

/**
 * List all organizers
 * GET /admin/organizers
 * 
 * Admin can view all organizers (active and inactive)
 */
const listOrganizers = async (req, res) => {
  try {
    const { isActive } = req.query;

    // Build filter
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const organizers = await Organizer.find(filter)
      .select('-passwordHash') // Don't send password hash
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: organizers.length,
      organizers: organizers.map(org => ({
        id: org._id,
        name: org.name,
        category: org.category,
        contactEmail: org.contactEmail,
        contactNumber: org.contactNumber,
        loginEmail: org.loginEmail,
        isActive: org.isActive,
        createdAt: org.createdAt
      }))
    });
  } catch (error) {
    console.error('List organizers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizers'
    });
  }
};

/**
 * Get single organizer details
 * GET /admin/organizers/:id
 */
const getOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id)
      .select('-passwordHash');

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
    console.error('Get organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizer'
    });
  }
};

/**
 * Disable organizer
 * PATCH /admin/organizers/:id/disable
 * 
 * Why disable instead of delete:
 * - Events reference organizerId
 * - Registrations reference events
 * - Deletion breaks referential integrity
 * - Disabled organizers cannot login but data remains intact
 */
const disableOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    if (!organizer.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Organizer is already disabled'
      });
    }

    // Disable organizer
    organizer.isActive = false;
    await organizer.save();

    res.status(200).json({
      success: true,
      message: 'Organizer disabled successfully',
      organizer: {
        id: organizer._id,
        name: organizer.name,
        isActive: organizer.isActive
      }
    });
  } catch (error) {
    console.error('Disable organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable organizer'
    });
  }
};

/**
 * Enable organizer (re-activate)
 * PATCH /admin/organizers/:id/enable
 * 
 * Allows admin to re-enable a disabled organizer
 */
const enableOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    if (organizer.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Organizer is already active'
      });
    }

    // Enable organizer
    organizer.isActive = true;
    await organizer.save();

    res.status(200).json({
      success: true,
      message: 'Organizer enabled successfully',
      organizer: {
        id: organizer._id,
        name: organizer.name,
        isActive: organizer.isActive
      }
    });
  } catch (error) {
    console.error('Enable organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable organizer'
    });
  }
};

/**
 * Get admin dashboard
 * GET /admin/dashboard
 * 
 * Returns system-wide statistics
 */
const getAdminDashboard = async (req, res) => {
  try {
    const User = require('../models/User');
    const Event = require('../models/Event');
    const Registration = require('../models/Registration');
    const { USER_ROLES } = require('../utils/constants');

    // Count totals
    const totalOrganizers = await Organizer.countDocuments();
    const activeOrganizers = await Organizer.countDocuments({ isActive: true });
    const totalParticipants = await User.countDocuments({ role: USER_ROLES.PARTICIPANT });
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();

    // Get recent organizers
    const recentOrganizers = await Organizer.find()
      .select('name category isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      summary: {
        totalOrganizers,
        activeOrganizers,
        totalParticipants,
        totalEvents,
        totalRegistrations
      },
      recentOrganizers: recentOrganizers.map(org => ({
        id: org._id,
        name: org.name,
        category: org.category,
        isActive: org.isActive,
        createdAt: org.createdAt
      }))
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard'
    });
  }
};

module.exports = {
  createOrganizer,
  listOrganizers,
  getOrganizer,
  disableOrganizer,
  enableOrganizer,
  getAdminDashboard
};
