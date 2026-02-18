/**
 * Participant Event Controller
 * 
 * Handles event browsing and registration for participants
 * 
 * Visibility Rules:
 * - Only published events visible
 * - Never show draft or closed events
 * 
 * Registration Rules:
 * - Only published events
 * - Before registration deadline
 * - Not at capacity
 * - No duplicate registrations
 */

const crypto = require('crypto');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Ticket = require('../models/Ticket');
const Organizer = require('../models/Organizer');
const User = require('../models/User');
const { sendRegistrationConfirmationEmail } = require('../utils/emailService');
const { EVENT_STATUS, REGISTRATION_STATUS, REGISTRATION_TYPES, EVENT_TYPES } = require('../utils/constants');

/**
 * Browse events (list with filters)
 * GET /events
 * 
 * Visibility: published events only
 * Supports: pagination, search, filters
 */
const browseEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      organizerId,
      startDateFrom,
      startDateTo
    } = req.query;

    // Build filter - only published events
    const filter = {
      status: EVENT_STATUS.PUBLISHED
    };

    // Search by event name (partial match, case-insensitive)
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Filter by event type
    if (type) {
      filter.type = type;
    }

    // Filter by organizer
    if (organizerId) {
      filter.organizerId = organizerId;
    }

    // Filter by date range
    if (startDateFrom || startDateTo) {
      filter.startDate = {};
      if (startDateFrom) {
        filter.startDate.$gte = new Date(startDateFrom);
      }
      if (startDateTo) {
        filter.startDate.$lte = new Date(startDateTo);
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const events = await Event.find(filter)
      .sort({ startDate: 1 }) // Default sort: startDate ASC
      .skip(skip)
      .limit(limitNum)
      .populate('organizerId', 'name category')
      .select('-__v');

    // Get total count for pagination metadata
    const total = await Event.countDocuments(filter);

    res.status(200).json({
      success: true,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      count: events.length,
      events: events.map(event => ({
        id: event._id,
        _id: event._id,
        name: event.name,
        description: event.description,
        type: event.type,
        categories: event.categories || [],
        eligibility: event.eligibility,
        registrationDeadline: event.registrationDeadline,
        startDate: event.startDate,
        endDate: event.endDate,
        registrationFee: event.registrationFee,
        registrationLimit: event.registrationLimit,
        tags: event.tags,
        organizer: event.organizerId ? {
          id: event.organizerId._id,
          name: event.organizerId.name,
          category: event.organizerId.category
        } : null
      }))
    });
  } catch (error) {
    console.error('Browse events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events'
    });
  }
};

/**
 * Get event details
 * GET /events/:id
 * 
 * Visibility: published events only
 * Returns: full event details + computed flags
 */
const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name category description contactEmail');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Only show published events to participants
    if (event.status !== EVENT_STATUS.PUBLISHED) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Compute flags
    const now = new Date();
    const isRegistrationOpen = 
      event.registrationDeadline && 
      new Date(event.registrationDeadline) > now &&
      event.status === EVENT_STATUS.PUBLISHED;

    // Calculate if event is full
    const registrationCount = await Registration.countDocuments({
      eventId: event._id,
      status: REGISTRATION_STATUS.REGISTERED
    });
    
    const isFull = event.registrationLimit 
      ? registrationCount >= event.registrationLimit 
      : false;

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
        tags: event.tags,
        status: event.status,
        organizer: event.organizerId ? {
          id: event.organizerId._id,
          name: event.organizerId.name,
          category: event.organizerId.category,
          description: event.organizerId.description,
          contactEmail: event.organizerId.contactEmail
        } : null,
        teamRegistration: event.teamRegistration || { enabled: false },
      computed: {
          isRegistrationOpen,
          isFull
        }
      }
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details'
    });
  }
};

/**
 * Register for event
 * POST /events/:id/register
 * 
 * Eligibility Rules (All must pass):
 * 1. Event status = published
 * 2. Current time < registrationDeadline
 * 3. registrationLimit not reached
 * 4. Participant not already registered
 * 
 * For normal events: Creates registration + ticket
 */
const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const participantId = req.actor.id;

    // 1. Fetch event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Only allow registration for normal events (merchandise has separate flow)
    if (event.type === EVENT_TYPES.MERCHANDISE) {
      return res.status(400).json({
        success: false,
        message: 'Use purchase endpoint for merchandise events'
      });
    }

    // 2. Validate eligibility

    // Rule 1: Event must be published
    if (event.status !== EVENT_STATUS.PUBLISHED) {
      return res.status(400).json({
        success: false,
        message: 'Event is not open for registration'
      });
    }

    // Rule 2: Registration deadline not passed
    const now = new Date();
    if (!event.registrationDeadline || new Date(event.registrationDeadline) <= now) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Rule 3: Check registration limit
    if (event.registrationLimit) {
      const registrationCount = await Registration.countDocuments({
        eventId: event._id,
        status: REGISTRATION_STATUS.REGISTERED
      });

      if (registrationCount >= event.registrationLimit) {
        return res.status(400).json({
          success: false,
          message: 'Event is full'
        });
      }
    }

    // Rule 4: Check if already registered
    const existingRegistration = await Registration.findOne({
      eventId: event._id,
      participantId: participantId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // 3. Create registration
    const registration = new Registration({
      eventId: event._id,
      participantId: participantId,
      registrationType: REGISTRATION_TYPES.NORMAL,
      status: REGISTRATION_STATUS.REGISTERED
    });

    await registration.save();

    // 4. Generate ticket
    const ticketId = `TKT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    
    const ticket = new Ticket({
      registrationId: registration._id,
      ticketId: ticketId,
      qrCode: ticketId
    });

    await ticket.save();

    // 5. Send confirmation email (non-blocking)
    let emailPreviewUrl = null;
    try {
      const participant = await User.findById(participantId).select('name email');
      if (participant) {
        const emailResult = await sendRegistrationConfirmationEmail(participant, event, ticket);
        if (emailResult && emailResult.previewUrl) {
          emailPreviewUrl = emailResult.previewUrl;
        }
      }
    } catch (emailErr) {
      console.warn('Registration email failed (non-fatal):', emailErr.message);
    }

    // 6. Return success
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration: {
        id: registration._id,
        eventId: registration.eventId,
        eventName: event.name,
        registrationType: registration.registrationType,
        status: registration.status,
        createdAt: registration.createdAt
      },
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        issuedAt: ticket.issuedAt
      },
      // In dev mode (Ethereal), provides a URL to preview the confirmation email
      ...(emailPreviewUrl && { emailPreviewUrl })
    });
  } catch (error) {
    // Handle duplicate registration (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

/**
 * Get my registrations with tickets
 * GET /me/registrations
 * 
 * Returns all registrations with ticket information
 */
const getMyRegistrations = async (req, res) => {
  try {
    const participantId = req.actor.id;

    const registrations = await Registration.find({
      participantId: participantId
    })
      .populate('eventId')
      .sort({ createdAt: -1 });

    // Format response with event and ticket details
    const formattedRegistrations = await Promise.all(
      registrations.map(async (reg) => {
        if (!reg.eventId) {
          return null; // Event deleted or not found
        }

        const event = reg.eventId;
        
        // Get organizer details
        const organizer = await Organizer.findById(event.organizerId)
          .select('name category');

        // Get ticket if exists
        const ticket = await Ticket.findOne({ registrationId: reg._id });

        return {
          registrationId: reg._id,
          registrationStatus: reg.status,
          registrationType: reg.registrationType,
          registeredAt: reg.createdAt,
          event: {
            id: event._id,
            name: event.name,
            type: event.type,
            status: event.status,
            startDate: event.startDate,
            endDate: event.endDate,
            registrationFee: event.registrationFee,
            organizer: organizer ? {
              id: organizer._id,
              name: organizer.name,
              category: organizer.category
            } : null
          },
          ticket: ticket ? {
            id: ticket._id,
            ticketId: ticket.ticketId,
            issuedAt: ticket.issuedAt
          } : null
        };
      })
    );

    // Filter out null entries (deleted events)
    const validRegistrations = formattedRegistrations.filter(reg => reg !== null);

    res.status(200).json({
      success: true,
      count: validRegistrations.length,
      registrations: validRegistrations
    });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve registrations'
    });
  }
};

/**
 * Get participant dashboard
 * GET /me/dashboard
 * 
 * Returns structured data:
 * - Upcoming events (registered)
 * - Past events (registered)
 * - Cancelled/rejected registrations
 * - Separated by normal vs merchandise
 */
const getParticipantDashboard = async (req, res) => {
  try {
    const participantId = req.actor.id;
    const now = new Date();

    // Fetch all registrations with event details
    const registrations = await Registration.find({
      participantId: participantId
    })
      .populate('eventId')
      .sort({ createdAt: -1 });

    // Classify registrations
    const upcomingEvents = [];
    const pastEvents = [];
    const cancelledRejected = [];
    
    const normalEvents = { upcoming: [], past: [], cancelled: [] };
    const merchandiseEvents = { upcoming: [], past: [], cancelled: [] };

    for (const reg of registrations) {
      if (!reg.eventId) continue; // Skip if event deleted

      const event = reg.eventId;
      const organizer = await Organizer.findById(event.organizerId)
        .select('name category');

      const eventData = {
        registrationId: reg._id,
        registrationStatus: reg.status,
        registrationType: reg.registrationType,
        registeredAt: reg.createdAt,
        event: {
          id: event._id,
          name: event.name,
          type: event.type,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate,
          registrationFee: event.registrationFee,
          organizer: organizer ? {
            id: organizer._id,
            name: organizer.name,
            category: organizer.category
          } : null
        }
      };

      // Classify by status
      if (reg.status === REGISTRATION_STATUS.CANCELLED || 
          reg.status === REGISTRATION_STATUS.REJECTED) {
        cancelledRejected.push(eventData);
        
        if (event.type === 'merchandise') {
          merchandiseEvents.cancelled.push(eventData);
        } else {
          normalEvents.cancelled.push(eventData);
        }
      } else if (reg.status === REGISTRATION_STATUS.REGISTERED) {
        // Classify by date
        if (event.endDate && new Date(event.endDate) < now) {
          pastEvents.push(eventData);
          
          if (event.type === 'merchandise') {
            merchandiseEvents.past.push(eventData);
          } else {
            normalEvents.past.push(eventData);
          }
        } else {
          upcomingEvents.push(eventData);
          
          if (event.type === 'merchandise') {
            merchandiseEvents.upcoming.push(eventData);
          } else {
            normalEvents.upcoming.push(eventData);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      dashboard: {
        summary: {
          totalRegistrations: registrations.length,
          upcomingCount: upcomingEvents.length,
          pastCount: pastEvents.length,
          cancelledCount: cancelledRejected.length
        },
        upcomingEvents,
        pastEvents,
        cancelledRejected,
        byType: {
          normal: normalEvents,
          merchandise: merchandiseEvents
        }
      }
    });
  } catch (error) {
    console.error('Get participant dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard'
    });
  }
};

/**
 * Purchase merchandise
 * POST /events/:id/purchase
 * 
 * Eligibility:
 * - Event type = merchandise
 * - Status = published
 * - Stock available
 * - Under purchase limit per user
 */
const purchaseMerchandise = async (req, res) => {
  try {
    const eventId = req.params.id;
    const participantId = req.actor.id;
    const { quantity = 1 } = req.body;

    // 1. Fetch event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Must be merchandise event
    if (event.type !== EVENT_TYPES.MERCHANDISE) {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is for merchandise events only'
      });
    }

    // Must be published
    if (event.status !== EVENT_STATUS.PUBLISHED) {
      return res.status(400).json({
        success: false,
        message: 'Merchandise not available'
      });
    }

    // Check registration deadline
    const now = new Date();
    if (!event.registrationDeadline || new Date(event.registrationDeadline) <= now) {
      return res.status(400).json({
        success: false,
        message: 'Purchase deadline has passed'
      });
    }

    // Check stock
    const stock = event.merchandiseDetails?.stock || 0;
    if (stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Check purchase limit per user
    const purchaseLimit = event.merchandiseDetails?.purchaseLimit || 1;
    const existingPurchases = await Registration.countDocuments({
      eventId: event._id,
      participantId: participantId,
      status: REGISTRATION_STATUS.REGISTERED
    });

    if (existingPurchases + quantity > purchaseLimit) {
      return res.status(400).json({
        success: false,
        message: `Purchase limit exceeded. Maximum ${purchaseLimit} per user`
      });
    }

    // Create registration
    const registration = new Registration({
      eventId: event._id,
      participantId: participantId,
      registrationType: REGISTRATION_TYPES.MERCHANDISE,
      status: REGISTRATION_STATUS.REGISTERED
    });

    await registration.save();

    // Generate ticket
    const ticketId = `MERCH-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    
    const ticket = new Ticket({
      registrationId: registration._id,
      ticketId: ticketId,
      qrCode: ticketId
    });

    await ticket.save();

    // Send confirmation email (non-blocking)
    try {
      const participant = await User.findById(participantId).select('name email');
      if (participant) {
        await sendRegistrationConfirmationEmail(participant, event, ticket);
      }
    } catch (emailErr) {
      console.warn('Merchandise purchase email failed (non-fatal):', emailErr.message);
    }

    // Decrement stock
    if (!event.merchandiseDetails) {
      event.merchandiseDetails = {};
    }
    event.merchandiseDetails.stock = (event.merchandiseDetails.stock || 0) - quantity;
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Purchase successful',
      purchase: {
        id: registration._id,
        eventId: registration.eventId,
        eventName: event.name,
        quantity: quantity,
        status: registration.status,
        createdAt: registration.createdAt
      },
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        issuedAt: ticket.issuedAt
      }
    });
  } catch (error) {
    console.error('Purchase merchandise error:', error);
    res.status(500).json({
      success: false,
      message: 'Purchase failed'
    });
  }
};

module.exports = {
  browseEvents,
  getEventDetails,
  registerForEvent,
  purchaseMerchandise,
  getMyRegistrations,
  getParticipantDashboard
};
