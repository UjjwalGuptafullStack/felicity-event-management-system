/**
 * Event Controller (Organizer Side)
 * 
 * Handles event lifecycle management for organizers
 * Enforces strict state transitions and ownership
 */

const Event = require('../models/Event');
const { EVENT_STATUS, EVENT_TYPES, EVENT_CATEGORIES } = require('../utils/constants');
const { ownsEvent, ownershipDenied } = require('../utils/accessControl');

/**
 * Validate event dates
 * @param {Date} registrationDeadline 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {string|null} Error message or null if valid
 */
const validateEventDates = (registrationDeadline, startDate, endDate) => {
  if (!registrationDeadline || !startDate || !endDate) {
    return 'Registration deadline, start date, and end date are required';
  }

  const regDeadline = new Date(registrationDeadline);
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (regDeadline >= start) {
    return 'Registration deadline must be before start date';
  }

  if (start > end) {
    return 'Start date must be before or equal to end date';
  }

  return null;
};

/**
 * Create new event (draft)
 * POST /organizer/events
 */
const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      categories,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      tags,
      teamRegistration
    } = req.body;

    // Required field validation
    if (!name || !type || !registrationDeadline || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, registration deadline, start date, and end date are required'
      });
    }

    // Type validation
    if (!Object.values(EVENT_TYPES).includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type'
      });
    }

    // Date validation
    const dateError = validateEventDates(registrationDeadline, startDate, endDate);
    if (dateError) {
      return res.status(400).json({
        success: false,
        message: dateError
      });
    }

    // Registration limit validation
    if (registrationLimit !== undefined && registrationLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Registration limit must be greater than 0'
      });
    }

    // Registration fee validation
    if (registrationFee !== undefined && registrationFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Registration fee cannot be negative'
      });
    }

    // Categories validation (optional, but if provided must be valid)
    let processedCategories = [];
    if (categories && Array.isArray(categories)) {
      processedCategories = categories
        .map(cat => cat.trim().toLowerCase())
        .filter(cat => cat.length > 0);
    }

    // Create event as draft
    const event = new Event({
      name,
      description,
      type,
      categories: processedCategories,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee: registrationFee || 0,
      organizerId: req.actor.id,
      teamRegistration: teamRegistration
        ? {
            enabled: !!teamRegistration.enabled,
            minSize: Math.max(2, parseInt(teamRegistration.minSize) || 2),
            maxSize: Math.max(2, parseInt(teamRegistration.maxSize) || 5)
          }
        : { enabled: false, minSize: 2, maxSize: 5 },
      tags: tags || [],
      status: EVENT_STATUS.DRAFT
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created as draft',
      event: {
        id: event._id,
        name: event.name,
        type: event.type,
        status: event.status,
        registrationDeadline: event.registrationDeadline,
        startDate: event.startDate,
        endDate: event.endDate,
        createdAt: event.createdAt
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
};

/**
 * List own events
 * GET /organizer/events
 */
const listOwnEvents = async (req, res) => {
  try {
    const { status } = req.query;

    // Build filter - only organizer's own events
    const filter = { organizerId: req.actor.id };
    
    if (status && Object.values(EVENT_STATUS).includes(status)) {
      filter.status = status;
    }

    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: events.length,
      events: events.map(event => ({
        id: event._id,
        _id: event._id,
        name: event.name,
        type: event.type,
        status: event.status,
        registrationDeadline: event.registrationDeadline,
        startDate: event.startDate,
        endDate: event.endDate,
        registrationLimit: event.registrationLimit,
        registrationFee: event.registrationFee,
        tags: event.tags,
        teamRegistration: event.teamRegistration || { enabled: false, minSize: 2, maxSize: 5 },
        createdAt: event.createdAt
      }))
    });
  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events'
    });
  }
};

/**
 * Get single event details
 * GET /organizer/events/:id
 */
const getOwnEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Ownership check
    if (!ownsEvent(req.actor, event)) {
      return res.status(403).json(ownershipDenied());
    }

    res.status(200).json({
      success: true,
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        type: event.type,
        eligibility: event.eligibility,
        registrationDeadline: event.registrationDeadline,
        startDate: event.startDate,
        endDate: event.endDate,
        registrationLimit: event.registrationLimit,
        registrationFee: event.registrationFee,
        organizerId: event.organizerId,
        tags: event.tags,
        status: event.status,
        teamRegistration: event.teamRegistration || { enabled: false, minSize: 2, maxSize: 5 },
        createdAt: event.createdAt
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event'
    });
  }
};

/**
 * Update event (draft only)
 * PATCH /organizer/events/:id
 */
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Ownership check
    if (!ownsEvent(req.actor, event)) {
      return res.status(403).json(ownershipDenied());
    }

    // Can only edit draft or published events
    if (![EVENT_STATUS.DRAFT, EVENT_STATUS.PUBLISHED].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: 'Ongoing or completed events cannot be edited'
      });
    }

    const {
      name,
      description,
      type,
      categories,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      tags,
      teamRegistration
    } = req.body;

    // PUBLISHED: only limited fields allowed
    if (event.status === EVENT_STATUS.PUBLISHED) {
      if (description !== undefined) event.description = description;
      if (tags !== undefined) event.tags = tags;

      if (registrationDeadline !== undefined) {
        const newDeadline = new Date(registrationDeadline);
        const currentDeadline = new Date(event.registrationDeadline);
        if (newDeadline <= currentDeadline) {
          return res.status(400).json({
            success: false,
            message: 'For published events you can only extend the registration deadline (new date must be after current)'
          });
        }
        event.registrationDeadline = registrationDeadline;
      }

      if (registrationLimit !== undefined) {
        const newLimit = parseInt(registrationLimit);
        if (event.registrationLimit && newLimit <= event.registrationLimit) {
          return res.status(400).json({
            success: false,
            message: 'For published events you can only increase the registration limit'
          });
        }
        event.registrationLimit = newLimit;
      }

      await event.save();
      return res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        event: { id: event._id, name: event.name, type: event.type, status: event.status }
      });
    }

    // DRAFT: all fields allowed

    // Update fields if provided
    if (name !== undefined) event.name = name;
    if (description !== undefined) event.description = description;
    if (type !== undefined) {
      if (!Object.values(EVENT_TYPES).includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event type'
        });
      }
      event.type = type;
    }
    if (eligibility !== undefined) event.eligibility = eligibility;
    if (categories !== undefined) {
      if (Array.isArray(categories)) {
        event.categories = categories
          .map(cat => cat.trim().toLowerCase())
          .filter(cat => cat.length > 0);
      }
    }
    if (registrationDeadline !== undefined) event.registrationDeadline = registrationDeadline;
    if (startDate !== undefined) event.startDate = startDate;
    if (endDate !== undefined) event.endDate = endDate;
    if (registrationLimit !== undefined) {
      if (registrationLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Registration limit must be greater than 0'
        });
      }
      event.registrationLimit = registrationLimit;
    }
    if (registrationFee !== undefined) {
      if (registrationFee < 0) {
        return res.status(400).json({
          success: false,
          message: 'Registration fee cannot be negative'
        });
      }
      event.registrationFee = registrationFee;
    }
    if (tags !== undefined) event.tags = tags;
    if (teamRegistration !== undefined) {
      event.teamRegistration = {
        enabled: !!teamRegistration.enabled,
        minSize: Math.max(2, parseInt(teamRegistration.minSize) || 2),
        maxSize: Math.max(2, parseInt(teamRegistration.maxSize) || 5)
      };
    }

    // Validate dates if any date field was updated
    if (registrationDeadline !== undefined || startDate !== undefined || endDate !== undefined) {
      const dateError = validateEventDates(
        event.registrationDeadline,
        event.startDate,
        event.endDate
      );
      if (dateError) {
        return res.status(400).json({
          success: false,
          message: dateError
        });
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: {
        id: event._id,
        name: event.name,
        type: event.type,
        status: event.status,
        registrationDeadline: event.registrationDeadline,
        startDate: event.startDate,
        endDate: event.endDate
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
};

/**
 * Publish event
 * POST /organizer/events/:id/publish
 */
const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Ownership check
    if (!ownsEvent(req.actor, event)) {
      return res.status(403).json(ownershipDenied());
    }

    // Can only publish draft events
    if (event.status !== EVENT_STATUS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: 'Only draft events can be published'
      });
    }

    // Validate all required fields are present
    if (!event.name || !event.type || !event.registrationDeadline || 
        !event.startDate || !event.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Event is incomplete. All required fields must be filled before publishing.'
      });
    }

    // Validate dates
    const dateError = validateEventDates(
      event.registrationDeadline,
      event.startDate,
      event.endDate
    );
    if (dateError) {
      return res.status(400).json({
        success: false,
        message: dateError
      });
    }

    // Publish event
    event.status = EVENT_STATUS.PUBLISHED;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event published successfully',
      event: {
        id: event._id,
        name: event.name,
        status: event.status,
        registrationDeadline: event.registrationDeadline,
        startDate: event.startDate,
        endDate: event.endDate
      }
    });
  } catch (error) {
    console.error('Publish event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish event'
    });
  }
};

/**
 * View registrations for own event (with attendance info)
 * GET /organizer/events/:id/registrations
 */
const viewEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!ownsEvent(req.actor, event)) return res.status(403).json(ownershipDenied());

    const Registration = require('../models/Registration');
    const Attendance = require('../models/Attendance');

    const registrations = await Registration.find({ eventId: event._id })
      .populate('participantId', 'firstName lastName email contactNumber participantType')
      .sort({ createdAt: -1 });

    // Fetch attendance records indexed by registrationId
    const attendanceRecords = await Attendance.find({ eventId: event._id });
    const attendanceMap = {};
    for (const a of attendanceRecords) {
      attendanceMap[a.registrationId.toString()] = a;
    }

    const formattedRegistrations = registrations.map(reg => {
      const participant = reg.participantId;
      const attendance = attendanceMap[reg._id.toString()];
      return {
        registrationId: reg._id,
        participant: participant ? {
          name: `${participant.firstName} ${participant.lastName}`,
          email: participant.email,
          contactNumber: participant.contactNumber,
          participantType: participant.participantType
        } : null,
        registeredAt: reg.createdAt,
        status: reg.status,
        registrationType: reg.registrationType,
        paymentStatus: reg.paymentStatus,
        totalAmount: reg.totalAmount || 0,
        attended: !!attendance,
        attendedAt: attendance?.scannedAt || null
      };
    });

    res.status(200).json({
      success: true,
      event: { id: event._id, name: event.name, type: event.type, status: event.status },
      count: formattedRegistrations.length,
      registrations: formattedRegistrations
    });
  } catch (error) {
    console.error('View event registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve registrations' });
  }
};

/**
 * Close registrations for a published/ongoing event
 * POST /organizer/events/:id/close-registrations
 */
const closeEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!ownsEvent(req.actor, event)) return res.status(403).json(ownershipDenied());
    if (!['published', 'ongoing'].includes(event.status)) {
      return res.status(400).json({ success: false, message: 'Can only close registrations for published or ongoing events' });
    }
    // Set deadline to now to close registrations
    event.registrationDeadline = new Date();
    await event.save();
    res.status(200).json({ success: true, message: 'Registrations closed successfully' });
  } catch (error) {
    console.error('Close registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to close registrations' });
  }
};

/**
 * Get analytics for an event
 * GET /organizer/events/:id/analytics
 */
const getEventAnalytics = async (req, res) => {
  try {
    const Registration = require('../models/Registration');
    const Attendance = require('../models/Attendance');
    const { REGISTRATION_STATUS } = require('../utils/constants');

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!ownsEvent(req.actor, event)) return res.status(403).json(ownershipDenied());

    const [registrations, attendanceCount] = await Promise.all([
      Registration.find({ eventId: event._id, status: REGISTRATION_STATUS.REGISTERED }),
      Attendance.countDocuments({ eventId: event._id })
    ]);

    const registrationCount = registrations.length;
    const revenue = registrations.reduce((sum, r) => sum + (r.totalAmount || 0), 0) ||
      (registrationCount * (event.registrationFee || 0));

    res.status(200).json({
      success: true,
      analytics: {
        registrations: registrationCount,
        attendance: attendanceCount,
        revenue,
        capacity: event.registrationLimit || null,
        fillRate: event.registrationLimit
          ? +((registrationCount / event.registrationLimit) * 100).toFixed(1)
          : null,
        attendanceRate: registrationCount > 0
          ? +((attendanceCount / registrationCount) * 100).toFixed(1)
          : 0,
        registrationFee: event.registrationFee || 0,
        teamRegistrationEnabled: event.teamRegistration?.enabled || false
      }
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics' });
  }
};

/**
 * Get organizer dashboard
 * GET /organizer/dashboard
 */
const getOrganizerDashboard = async (req, res) => {
  try {
    const Registration = require('../models/Registration');
    const { REGISTRATION_STATUS } = require('../utils/constants');

    // Fetch all events for this organizer
    const events = await Event.find({ organizerId: req.actor.id })
      .sort({ createdAt: -1 });

    // Get stats for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({
          eventId: event._id,
          status: REGISTRATION_STATUS.REGISTERED
        });

        const revenue = registrationCount * (event.registrationFee || 0);

        return {
          id: event._id,
          name: event.name,
          type: event.type,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate,
          registrationLimit: event.registrationLimit,
          registrationFee: event.registrationFee,
          stats: {
            registrations: registrationCount,
            capacity: event.registrationLimit || 'Unlimited',
            revenue: revenue
          },
          createdAt: event.createdAt
        };
      })
    );

    // Calculate totals
    const totalEvents = events.length;
    const totalRegistrations = eventsWithStats.reduce((sum, e) => sum + e.stats.registrations, 0);
    const totalRevenue = eventsWithStats.reduce((sum, e) => sum + e.stats.revenue, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalEvents,
        totalRegistrations,
        totalRevenue
      },
      events: eventsWithStats
    });
  } catch (error) {
    console.error('Get organizer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard'
    });
  }
};

module.exports = {
  createEvent,
  listOwnEvents,
  getOwnEvent,
  updateEvent,
  publishEvent,
  viewEventRegistrations,
  getOrganizerDashboard
};
