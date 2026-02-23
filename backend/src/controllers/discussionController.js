/**
 * Discussion Forum Controller
 * Handles real-time discussion messages for events
 * Tier B2 Feature
 */

const DiscussionMessage = require('../models/DiscussionMessage');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const Event = require('../models/Event');
const User = require('../models/User');
const Organizer = require('../models/Organizer');

/**
 * Post message to discussion forum
 * POST /events/:id/discussion/messages
 */
const postMessage = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { content, parentMessageId } = req.body;
    const { id: senderId, actorType } = req.actor;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 2000 characters)'
      });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    let senderName;
    let senderType;

    // Check permissions based on actor type
    if (actorType === 'organizer') {
      // Verify organizer owns the event
      if (event.organizerId.toString() !== senderId) {
        return res.status(403).json({
          success: false,
          message: 'You can only post in your own event discussions'
        });
      }
      const organizer = await Organizer.findById(senderId);
      senderName = organizer.name;
      senderType = 'organizer';
    } else {
      // Verify participant is registered for event OR is a member of any non-cancelled team for the event
      const [registration, team] = await Promise.all([
        Registration.findOne({ eventId, participantId: senderId }),
        Team.findOne({ eventId, 'members.userId': senderId, status: { $ne: 'cancelled' } })
      ]);

      if (!registration && !team) {
        return res.status(403).json({
          success: false,
          message: 'Only registered participants can post messages'
        });
      }

      // Discussion is anonymous — store a placeholder, display as Anonymous on client
      const user = await User.findById(senderId);
      senderName = `${user.firstName} ${user.lastName}`;
      senderType = 'participant';
    }

    // Validate parent message if replying
    if (parentMessageId) {
      const parentMessage = await DiscussionMessage.findById(parentMessageId);
      if (!parentMessage || parentMessage.eventId.toString() !== eventId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent message'
        });
      }
    }

    // Create message
    const message = new DiscussionMessage({
      eventId,
      senderId,
      senderType,
      senderName,
      content: content.trim(),
      parentMessageId: parentMessageId || null
    });

    await message.save();

    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      data: {
        id: message._id,
        senderId: message.senderId,
        senderName: message.senderName,
        senderType: message.senderType,
        content: message.content,
        parentMessageId: message.parentMessageId,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post message'
    });
  }
};

/**
 * Get discussion messages for event
 * GET /events/:id/discussion/messages
 */
const getMessages = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get messages (excluding deleted ones)
    const messages = await DiscussionMessage.find({
      eventId,
      isDeleted: false
    })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.status(200).json({
      success: true,
      count: messages.length,
      messages: messages.map(msg => ({
        id: msg._id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderType: msg.senderType,
        content: msg.content,
        isPinned: msg.isPinned,
        isAnnouncement: msg.isAnnouncement,
        parentMessageId: msg.parentMessageId,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages'
    });
  }
};

/**
 * Pin message (Organizer only)
 * POST /organizer/events/:id/discussion/messages/:messageId/pin
 */
const pinMessage = async (req, res) => {
  try {
    const { id: eventId, messageId } = req.params;
    const organizerId = req.actor.id;

    const event = await Event.findById(eventId);
    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const message = await DiscussionMessage.findById(messageId);
    if (!message || message.eventId.toString() !== eventId) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isPinned = true;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message pinned successfully'
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin message'
    });
  }
};

/**
 * Unpin message (Organizer only)
 * POST /organizer/events/:id/discussion/messages/:messageId/unpin
 */
const unpinMessage = async (req, res) => {
  try {
    const { id: eventId, messageId } = req.params;
    const organizerId = req.actor.id;

    const event = await Event.findById(eventId);
    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const message = await DiscussionMessage.findById(messageId);
    if (!message || message.eventId.toString() !== eventId) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isPinned = false;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message unpinned successfully'
    });
  } catch (error) {
    console.error('Unpin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpin message'
    });
  }
};

/**
 * Delete message (Organizer only)
 * DELETE /organizer/events/:id/discussion/messages/:messageId
 */
const deleteMessage = async (req, res) => {
  try {
    const { id: eventId, messageId } = req.params;
    const organizerId = req.actor.id;

    const event = await Event.findById(eventId);
    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const message = await DiscussionMessage.findById(messageId);
    if (!message || message.eventId.toString() !== eventId) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isDeleted = true;
    message.deletedBy = organizerId;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

/**
 * Post announcement (Organizer only)
 * POST /organizer/events/:id/discussion/announcement
 */
const postAnnouncement = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { content } = req.body;
    const organizerId = req.actor.id;

    const event = await Event.findById(eventId);
    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Announcement content is required'
      });
    }

    const organizer = await Organizer.findById(organizerId);

    const message = new DiscussionMessage({
      eventId,
      senderId: organizerId,
      senderType: 'organizer',
      senderName: organizer.name,
      content: content.trim(),
      isAnnouncement: true,
      isPinned: true
    });

    await message.save();

    res.status(201).json({
      success: true,
      message: 'Announcement posted successfully',
      data: {
        id: message._id,
        content: message.content,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Post announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post announcement'
    });
  }
};

module.exports = {
  postMessage,
  getMessages,
  pinMessage,
  unpinMessage,
  deleteMessage,
  postAnnouncement
};
