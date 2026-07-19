/**
 * Express app assembly — middleware, routes, error handling.
 * Deliberately has no side effects (no DB connect, no listen()) so it can be
 * required directly by tests (via supertest) without booting a real server.
 * server.js handles the process-level concerns: DB connection, admin
 * bootstrap, Socket.io, and starting the HTTP listener.
 */

const path    = require('path');
const express = require('express');
const cors    = require('cors');

// Routes
const authRoutes        = require('./routes/authRoutes');
const adminRoutes       = require('./routes/adminRoutes');
const organizerRoutes   = require('./routes/organizerRoutes');
const participantRoutes = require('./routes/participantRoutes');
const merchandiseRoutes = require('./routes/merchandiseRoutes');
const attendanceRoutes  = require('./routes/attendanceRoutes');
const discussionRoutes  = require('./routes/discussionRoutes');
const feedbackRoutes    = require('./routes/feedbackRoutes');
const analyticsRoutes   = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const publicRoutes      = require('./routes/publicRoutes');
const chatRoutes        = require('./routes/chatRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded chat files (file attachments)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/auth',        authRoutes);
app.use('/admin',       adminRoutes);
app.use('/organizer',   organizerRoutes);
app.use('/participant', participantRoutes);
app.use('/',            publicRoutes);
app.use('/',            merchandiseRoutes);
app.use('/',            attendanceRoutes);
app.use('/',            discussionRoutes);
app.use('/',            feedbackRoutes);
app.use('/',            analyticsRoutes);
app.use('/',            notificationRoutes);
app.use('/',            chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler — recognizes ApiError (explicit statusCode), Mongoose ValidationError,
// and Zod-thrown errors; anything else falls back to a generic 500.
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error('Server error:', err);
  }
  res.status(statusCode).json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = app;
