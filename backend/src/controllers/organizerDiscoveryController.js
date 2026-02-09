/**
 * Organizer Discovery Controller (Participant Side)
 * 
 * Handles organizer listing and discovery for participants
 * Shows only active organizers with their events
 */

const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const { EVENT_STATUS } = require('../utils/constants');

/**
 * List all active organizers
 * GET /organizers
 * 
 * Shows only active organizers to participants
 */
const listOrganizers = async (req, res) => {
  try {
    const { category } = req.query;

    // Build filter - only active organizers
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }

    const organizers = await Organizer.find(filter)
      .select('-passwordHash -loginEmail -__v')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: organizers.length,
      organizers: organizers.map(org => ({
        id: org._id,
        name: org.name,
        category: org.category,
        description: org.description,
        contactEmail: org.contactEmail,
        contactNumber: org.contactNumber
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
 * Get organizer details with events
 * GET /organizers/:id
 * 
 * Shows organizer info + upcoming and past events
 */
const getOrganizerDetails = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id)
      .select('-passwordHash -loginEmail -__v');

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Only show active organizers
    if (!organizer.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Fetch organizer's published events
    const now = new Date();
    
    const upcomingEvents = await Event.find({
      organizerId: organizer._id,
      status: EVENT_STATUS.PUBLISHED,
      startDate: { $gte: now }
    })
      .select('name type startDate endDate registrationDeadline registrationFee tags')
      .sort({ startDate: 1 })
      .limit(10);

    const pastEvents = await Event.find({
      organizerId: organizer._id,
      status: { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.ONGOING, EVENT_STATUS.CLOSED] },
      endDate: { $lt: now }
    })
      .select('name type startDate endDate')
      .sort({ endDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        category: organizer.category,
        description: organizer.description,
        contactEmail: organizer.contactEmail,
        contactNumber: organizer.contactNumber,
        createdAt: organizer.createdAt
      },
      events: {
        upcoming: upcomingEvents.map(e => ({
          id: e._id,
          name: e.name,
          type: e.type,
          startDate: e.startDate,
          endDate: e.endDate,
          registrationDeadline: e.registrationDeadline,
          registrationFee: e.registrationFee,
          tags: e.tags
        })),
        past: pastEvents.map(e => ({
          id: e._id,
          name: e.name,
          type: e.type,
          startDate: e.startDate,
          endDate: e.endDate
        }))
      }
    });
  } catch (error) {
    console.error('Get organizer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizer details'
    });
  }
};

module.exports = {
  listOrganizers,
  getOrganizerDetails
};
