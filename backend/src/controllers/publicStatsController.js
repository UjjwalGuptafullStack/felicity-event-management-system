const Event = require('../models/Event');
const User = require('../models/User');
const { EVENT_STATUS, USER_ROLES } = require('../utils/constants');

const getPublicStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

    const publishedFilter = { status: EVENT_STATUS.PUBLISHED };

    const totalParticipants = await User.countDocuments({ role: USER_ROLES.PARTICIPANT });
    const totalEvents = await Event.countDocuments(publishedFilter);

    const liveEvents = await Event.countDocuments({
      ...publishedFilter,
      startDate: { $lte: endOfToday, $ne: null },
      $or: [
        { endDate: { $gte: startOfToday } },
        { endDate: { $exists: false } },
        { endDate: null }
      ]
    });

    const upcomingEvents = await Event.countDocuments({
      ...publishedFilter,
      startDate: { $gt: endOfToday }
    });

    const lastMonthEvents = await Event.countDocuments({
      ...publishedFilter,
      startDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    const lastYearEvents = await Event.countDocuments({
      ...publishedFilter,
      startDate: { $gte: startOfLastYear, $lte: endOfLastYear }
    });

    res.status(200).json({
      success: true,
      asOf: now.toISOString(),
      participants: {
        total: totalParticipants
      },
      events: {
        liveToday: liveEvents,
        upcoming: upcomingEvents,
        lastMonth: lastMonthEvents,
        lastYear: lastYearEvents,
        total: totalEvents
      }
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve public stats'
    });
  }
};

module.exports = {
  getPublicStats
};
