/**
 * Server Entry Point
 * Initializes Express app and connects to MongoDB
 */

const express = require('express');
const cors = require('cors');
const config = require('./src/config/env');
const connectDB = require('./src/config/db');
const { runBootstrap } = require('./src/utils/bootstrap');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const organizerRoutes = require('./src/routes/organizerRoutes');
const participantRoutes = require('./src/routes/participantRoutes');
const part2Routes = require('./src/routes/part2Routes');
const publicRoutes = require('./src/routes/publicRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/organizer', organizerRoutes);
app.use('/participant', participantRoutes);
app.use('/', publicRoutes);

// Part-2 Feature Routes (Tier A, B, C)
app.use('/', part2Routes);

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
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  // 1. Connect to MongoDB first
  await connectDB();
  
  // 2. Run bootstrap tasks (create admin, etc.)
  await runBootstrap();
  
  // 3. Start Express server only if DB connected
  app.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🚀 Ready to accept requests`);
  });
};

// Start the application
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
