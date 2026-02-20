/**
 * Feedback Controller
 * Handles anonymous feedback submission and viewing
 * Tier C1 Feature
 */

const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');

/**
 * Submit feedback for event
 * POST /participant/events/:id/feedback
 */
const submitFeedback = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { rating, comment } = req.body;
    const participantId = req.actor.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
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

    // Check if event has ended
    const now = new Date();
    if (event.endDate > now) {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted after the event ends'
      });
    }

    // Verify participant attended the event (not just registered)
    const attended = await Attendance.findOne({
      eventId,
      participantId
    });

    if (!attended) {
      return res.status(403).json({
        success: false,
        message: 'Only participants who attended the event can submit feedback'
      });
    }

    // Check for existing feedback
    const existingFeedback = await Feedback.findOne({
      eventId,
      participantId
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this event'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      eventId,
      participantId,
      rating: parseInt(rating),
      comment: comment ? comment.trim() : undefined
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        rating: feedback.rating,
        submittedAt: feedback.submittedAt
      }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
};

/**
 * Get feedback for event (Organizer only)
 * GET /organizer/events/:id/feedback
 */
const getEventFeedback = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const organizerId = req.actor.id;

    // Verify event ownership
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all feedback (anonymous - no participant info)
    const feedbackList = await Feedback.find({ eventId })
      .sort({ submittedAt: -1 })
      .select('rating comment submittedAt');

    res.status(200).json({
      success: true,
      event: {
        id: event._id,
        name: event.name
      },
      count: feedbackList.length,
      feedback: feedbackList.map(fb => ({
        rating: fb.rating,
        comment: fb.comment,
        submittedAt: fb.submittedAt
      }))
    });
  } catch (error) {
    console.error('Get event feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback'
    });
  }
};

/**
 * Get feedback statistics (Organizer only)
 * GET /organizer/events/:id/feedback/stats
 */
const getFeedbackStats = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const organizerId = req.actor.id;

    // Verify event ownership
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Aggregate feedback statistics
    const feedbackList = await Feedback.find({ eventId });

    if (feedbackList.length === 0) {
      return res.status(200).json({
        success: true,
        event: {
          id: event._id,
          name: event.name
        },
        stats: {
          totalFeedback: 0,
          averageRating: 0,
          ratingDistribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        }
      });
    }

    // Calculate statistics
    const totalFeedback = feedbackList.length;
    const totalRating = feedbackList.reduce((sum, fb) => sum + fb.rating, 0);
    const averageRating = (totalRating / totalFeedback).toFixed(2);

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    feedbackList.forEach(fb => {
      ratingDistribution[fb.rating]++;
    });

    // Calculate percentages
    const ratingPercentages = {};
    Object.keys(ratingDistribution).forEach(rating => {
      ratingPercentages[rating] = ((ratingDistribution[rating] / totalFeedback) * 100).toFixed(2);
    });

    res.status(200).json({
      success: true,
      event: {
        id: event._id,
        name: event.name
      },
      stats: {
        totalFeedback,
        averageRating: parseFloat(averageRating),
        ratingDistribution,
        ratingPercentages
      }
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback statistics'
    });
  }
};

/**
 * Get my own feedback for an event (Participant)
 * GET /participant/events/:id/feedback/my
 * Returns: { submitted, attended, rating, comment } — anonymous to organizer but visible to self
 */
const getMyFeedback = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const participantId = req.actor.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const attended = await Attendance.findOne({ eventId, participantId });
    const feedback = await Feedback.findOne({ eventId, participantId });

    res.status(200).json({
      success: true,
      eventEnded: event.endDate < new Date(),
      attended: !!attended,
      submitted: !!feedback,
      feedback: feedback
        ? { rating: feedback.rating, comment: feedback.comment, submittedAt: feedback.submittedAt }
        : null
    });
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve feedback status' });
  }
};

/**
 * Export feedback as CSV (Organizer only)
 * GET /organizer/events/:id/feedback/export
 */
const exportFeedbackCSV = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const organizerId = req.actor.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const feedbackList = await Feedback.find({ eventId })
      .sort({ submittedAt: -1 })
      .select('rating comment submittedAt');

    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const rows = [
      ['Rating', 'Comment', 'Submitted At'],
      ...feedbackList.map(fb => [
        fb.rating,
        escape(fb.comment || ''),
        new Date(fb.submittedAt).toISOString()
      ])
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    const filename = `feedback-${event.name.replace(/\s+/g, '-')}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export feedback CSV error:', error);
    res.status(500).json({ success: false, message: 'Failed to export feedback' });
  }
};

module.exports = {
  submitFeedback,
  getEventFeedback,
  getFeedbackStats,
  getMyFeedback,
  exportFeedbackCSV
};
