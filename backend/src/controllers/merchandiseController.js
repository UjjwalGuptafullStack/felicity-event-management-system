/**
 * Merchandise Controller
 * Handles merchandise purchase and payment approval workflow
 * Tier A1 Feature
 */

const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Ticket = require('../models/Ticket');
const { REGISTRATION_TYPES } = require('../utils/constants');
const crypto = require('crypto');

/**
 * Purchase merchandise
 * POST /participant/events/:id/merchandise/purchase
 */
const purchaseMerchandise = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { items, paymentProofUrl } = req.body;
    const participantId = req.actor.id;

    // Validate event exists and is merchandise type
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.type !== 'merchandise') {
      return res.status(400).json({
        success: false,
        message: 'This event does not sell merchandise'
      });
    }

    // Check if already purchased
    const existingRegistration = await Registration.findOne({
      eventId,
      participantId,
      registrationType: REGISTRATION_TYPES.MERCHANDISE
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased merchandise for this event'
      });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    // Calculate total and validate stock availability
    let totalAmount = 0;
    const purchasedItems = [];

    for (const item of items) {
      const { itemIndex, variantIndex, quantity } = item;
      
      if (!event.merchandiseDetails.items[itemIndex]) {
        return res.status(400).json({
          success: false,
          message: `Invalid item index: ${itemIndex}`
        });
      }

      const merchandiseItem = event.merchandiseDetails.items[itemIndex];
      const variant = merchandiseItem.variants[variantIndex];

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Invalid variant index: ${variantIndex}`
        });
      }

      if (variant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${merchandiseItem.name}`
        });
      }

      totalAmount += variant.price * quantity;
      purchasedItems.push({
        itemIndex,
        variantIndex,
        quantity,
        priceAtPurchase: variant.price
      });
    }

    // Create registration with pending payment status
    const registration = new Registration({
      eventId,
      participantId,
      registrationType: REGISTRATION_TYPES.MERCHANDISE,
      paymentStatus: 'pending',
      paymentProofUrl,
      purchasedItems,
      totalAmount
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Merchandise purchase initiated. Awaiting payment approval.',
      registration: {
        id: registration._id,
        paymentStatus: registration.paymentStatus,
        totalAmount: registration.totalAmount,
        items: purchasedItems
      }
    });
  } catch (error) {
    console.error('Purchase merchandise error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase merchandise'
    });
  }
};

/**
 * Get pending merchandise payments for organizer
 * GET /organizer/merchandise/pending
 */
const getPendingPayments = async (req, res) => {
  try {
    const organizerId = req.actor.id;

    // Get all events by this organizer
    const events = await Event.find({ organizerId }).select('_id');
    const eventIds = events.map(e => e._id);

    // Get pending registrations
    const pendingRegistrations = await Registration.find({
      eventId: { $in: eventIds },
      registrationType: REGISTRATION_TYPES.MERCHANDISE,
      paymentStatus: 'pending'
    })
      .populate('eventId', 'name')
      .populate('participantId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingRegistrations.length,
      registrations: pendingRegistrations.map(reg => ({
        id: reg._id,
        event: {
          id: reg.eventId._id,
          name: reg.eventId.name
        },
        participant: {
          id: reg.participantId._id,
          name: `${reg.participantId.firstName} ${reg.participantId.lastName}`,
          email: reg.participantId.email
        },
        totalAmount: reg.totalAmount,
        paymentProofUrl: reg.paymentProofUrl,
        purchasedItems: reg.purchasedItems,
        createdAt: reg.createdAt
      }))
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending payments'
    });
  }
};

/**
 * Approve merchandise payment
 * POST /organizer/merchandise/:regId/approve
 */
const approvePayment = async (req, res) => {
  try {
    const { regId } = req.params;
    const organizerId = req.actor.id;

    const registration = await Registration.findById(regId).populate('eventId');
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Verify ownership
    if (registration.eventId.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (registration.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not pending'
      });
    }

    // Decrement stock
    const event = registration.eventId;
    for (const item of registration.purchasedItems) {
      const variant = event.merchandiseDetails.items[item.itemIndex].variants[item.variantIndex];
      variant.stock -= item.quantity;
    }
    await event.save();

    // Update registration
    registration.paymentStatus = 'approved';
    registration.approvedAt = new Date();
    registration.approvedBy = organizerId;
    await registration.save();

    // Generate ticket with QR code
    const qrCode = crypto.randomBytes(32).toString('hex');
    const ticket = new Ticket({
      registrationId: registration._id,
      ticketId: `MERCH-${registration._id}`,
      qrCode
    });
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Payment approved and ticket generated',
      registration: {
        id: registration._id,
        paymentStatus: registration.paymentStatus,
        approvedAt: registration.approvedAt
      },
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        qrCode: ticket.qrCode
      }
    });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve payment'
    });
  }
};

/**
 * Reject merchandise payment
 * POST /organizer/merchandise/:regId/reject
 */
const rejectPayment = async (req, res) => {
  try {
    const { regId } = req.params;
    const { reason } = req.body;
    const organizerId = req.actor.id;

    const registration = await Registration.findById(regId).populate('eventId');
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Verify ownership
    if (registration.eventId.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (registration.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not pending'
      });
    }

    // Update registration
    registration.paymentStatus = 'rejected';
    registration.rejectionReason = reason || 'Payment proof invalid';
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Payment rejected',
      registration: {
        id: registration._id,
        paymentStatus: registration.paymentStatus,
        rejectionReason: registration.rejectionReason
      }
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment'
    });
  }
};

module.exports = {
  purchaseMerchandise,
  getPendingPayments,
  approvePayment,
  rejectPayment
};
