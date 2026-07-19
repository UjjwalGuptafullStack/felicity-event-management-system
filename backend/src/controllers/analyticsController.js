/**
 * Analytics Controller
 * Cross-event registration/attendance trends for an organizer's dashboard,
 * plus CSV export of an individual event's registrant list.
 */

const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { ownsEvent, ownershipDenied } = require('../utils/accessControl');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Aggregate analytics across all of the organizer's events.
 * GET /organizer/analytics/overview
 */
const getOrganizerAnalyticsOverview = async (req, res) => {
  try {
    const organizerId = req.actor.id;

    const events = await Event.find({ organizerId }).select('_id name categories');
    const eventIds = events.map((e) => e._id);
    const eventById = new Map(events.map((e) => [e._id.toString(), e]));

    const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);

    const [dailyRegistrations, perEventCounts, totalAttendance] = await Promise.all([
      Registration.aggregate([
        { $match: { eventId: { $in: eventIds }, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Registration.aggregate([
        { $match: { eventId: { $in: eventIds } } },
        { $group: { _id: '$eventId', count: { $sum: 1 } } }
      ]),
      Attendance.countDocuments({ eventId: { $in: eventIds } })
    ]);

    const totalRegistrations = perEventCounts.reduce((sum, e) => sum + e.count, 0);

    const categoryTotals = {};
    const topEvents = [];
    for (const { _id: eventId, count } of perEventCounts) {
      const event = eventById.get(eventId.toString());
      if (!event) continue;
      topEvents.push({ id: eventId, name: event.name, registrations: count });
      for (const category of event.categories || []) {
        categoryTotals[category] = (categoryTotals[category] || 0) + count;
      }
    }
    topEvents.sort((a, b) => b.registrations - a.registrations);

    res.status(200).json({
      success: true,
      analytics: {
        totalEvents: events.length,
        totalRegistrations,
        totalAttendance,
        attendanceRate: totalRegistrations > 0
          ? +((totalAttendance / totalRegistrations) * 100).toFixed(1)
          : 0,
        registrationsOverTime: dailyRegistrations.map((d) => ({ date: d._id, count: d.count })),
        categoryBreakdown: Object.entries(categoryTotals).map(([category, count]) => ({ category, count })),
        topEvents: topEvents.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get organizer analytics overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve analytics' });
  }
};

/**
 * CSV export of every registrant for one event (registration + attendance status).
 * GET /organizer/events/:id/registrations/export
 */
const exportEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!ownsEvent(req.actor, event)) return res.status(403).json(ownershipDenied());

    const registrations = await Registration.find({ eventId: event._id })
      .populate('participantId', 'firstName lastName email contactNumber')
      .sort({ createdAt: 1 });

    const attendanceRecords = await Attendance.find({ eventId: event._id });
    const attendedSet = new Set(attendanceRecords.map((a) => a.registrationId.toString()));

    let csv = 'Name,Email,Contact,Registered At,Status,Registration Type,Payment Status,Amount,Attended\n';
    for (const reg of registrations) {
      const p = reg.participantId;
      const name = p ? `${p.firstName} ${p.lastName}` : 'N/A';
      const email = p?.email || 'N/A';
      const contact = p?.contactNumber || 'N/A';
      const registeredAt = new Date(reg.createdAt).toLocaleString();
      const attended = attendedSet.has(reg._id.toString()) ? 'Yes' : 'No';

      csv += `"${name}","${email}","${contact}","${registeredAt}","${reg.status}","${reg.registrationType}","${reg.paymentStatus || 'N/A'}","${reg.totalAmount || 0}","${attended}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, '-')}-registrations.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export event registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to export registrations' });
  }
};

module.exports = {
  getOrganizerAnalyticsOverview,
  exportEventRegistrations
};
