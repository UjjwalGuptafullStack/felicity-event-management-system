/**
 * Attendance Controller
 * Handles QR code scanning and attendance tracking
 * Tier A2 Feature
 */

const Attendance = require('../models/Attendance');
const Ticket = require('../models/Ticket');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

/**
 * Scan QR code and mark attendance
 * POST /organizer/events/:id/attendance/scan
 */
const scanQRCode = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { qrCode } = req.body;
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

    // Find ticket by QR code
    const ticket = await Ticket.findOne({ qrCode }).populate({
      path: 'registrationId',
      populate: { path: 'participantId', select: 'firstName lastName email' }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code'
      });
    }

    // Verify ticket belongs to this event
    if (ticket.registrationId.eventId.toString() !== eventId) {
      return res.status(400).json({
        success: false,
        message: 'This ticket is not for this event'
      });
    }

    // Check if already scanned
    if (ticket.isScanned) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already scanned',
        scannedAt: ticket.scannedAt
      });
    }

    // Check for duplicate attendance
    const existingAttendance = await Attendance.findOne({ ticketId: ticket._id });
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked',
        scannedAt: existingAttendance.scannedAt
      });
    }

    // Mark attendance
    const attendance = new Attendance({
      eventId,
      ticketId: ticket._id,
      registrationId: ticket.registrationId._id,
      participantId: ticket.registrationId.participantId._id,
      scannedBy: organizerId,
      scanMethod: 'qr_scan'
    });
    await attendance.save();

    // Update ticket
    ticket.isScanned = true;
    ticket.scannedAt = new Date();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      participant: {
        id: ticket.registrationId.participantId._id,
        name: `${ticket.registrationId.participantId.firstName} ${ticket.registrationId.participantId.lastName}`,
        email: ticket.registrationId.participantId.email
      },
      scannedAt: attendance.scannedAt
    });
  } catch (error) {
    console.error('Scan QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan QR code'
    });
  }
};

/**
 * Manual attendance entry
 * POST /organizer/events/:id/attendance/manual
 */
const manualAttendance = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { participantEmail, remarks } = req.body;
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

    // Find participant's registration
    const User = require('../models/User');
    const participant = await User.findOne({ email: participantEmail.toLowerCase() });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    const registration = await Registration.findOne({
      eventId,
      participantId: participant._id
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Participant not registered for this event'
      });
    }

    // Find ticket
    const ticket = await Ticket.findOne({ registrationId: registration._id });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'No ticket found for this registration'
      });
    }

    // Check for duplicate attendance
    const existingAttendance = await Attendance.findOne({ ticketId: ticket._id });
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked',
        scannedAt: existingAttendance.scannedAt
      });
    }

    // Mark attendance manually
    const attendance = new Attendance({
      eventId,
      ticketId: ticket._id,
      registrationId: registration._id,
      participantId: participant._id,
      scannedBy: organizerId,
      scanMethod: 'manual_entry',
      remarks
    });
    await attendance.save();

    // Update ticket
    ticket.isScanned = true;
    ticket.scannedAt = new Date();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Attendance marked manually',
      participant: {
        id: participant._id,
        name: `${participant.firstName} ${participant.lastName}`,
        email: participant.email
      },
      scannedAt: attendance.scannedAt
    });
  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
};

/**
 * Get attendance list for event
 * GET /organizer/events/:id/attendance
 */
const getAttendanceList = async (req, res) => {
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

    // Get attendance records
    const attendanceRecords = await Attendance.find({ eventId })
      .populate('participantId', 'firstName lastName email')
      .populate('scannedBy', 'name')
      .sort({ scannedAt: -1 });

    // Get total registrations
    const totalRegistrations = await Registration.countDocuments({ eventId });

    res.status(200).json({
      success: true,
      event: {
        id: event._id,
        name: event.name
      },
      stats: {
        totalRegistrations,
        attendanceCount: attendanceRecords.length,
        attendanceRate: totalRegistrations > 0 
          ? ((attendanceRecords.length / totalRegistrations) * 100).toFixed(2) 
          : 0
      },
      attendanceList: attendanceRecords.map(record => ({
        participant: {
          id: record.participantId._id,
          name: `${record.participantId.firstName} ${record.participantId.lastName}`,
          email: record.participantId.email
        },
        scannedAt: record.scannedAt,
        scanMethod: record.scanMethod,
        scannedBy: record.scannedBy?.name || 'Unknown',
        remarks: record.remarks
      }))
    });
  } catch (error) {
    console.error('Get attendance list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance list'
    });
  }
};

/**
 * Export attendance as CSV
 * GET /organizer/events/:id/attendance/export
 */
const exportAttendance = async (req, res) => {
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

    // Get attendance records
    const attendanceRecords = await Attendance.find({ eventId })
      .populate('participantId', 'firstName lastName email contactNumber')
      .sort({ scannedAt: 1 });

    // Generate CSV
    let csv = 'Name,Email,Contact,Scanned At,Scan Method,Remarks\n';
    
    for (const record of attendanceRecords) {
      const name = `${record.participantId.firstName} ${record.participantId.lastName}`;
      const email = record.participantId.email;
      const contact = record.participantId.contactNumber || 'N/A';
      const scannedAt = new Date(record.scannedAt).toLocaleString();
      const scanMethod = record.scanMethod;
      const remarks = record.remarks || '';
      
      csv += `"${name}","${email}","${contact}","${scannedAt}","${scanMethod}","${remarks}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${event.name}-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance'
    });
  }
};

module.exports = {
  scanQRCode,
  manualAttendance,
  getAttendanceList,
  exportAttendance
};
