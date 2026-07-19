/**
 * Server Entry Point
 * Connects to MongoDB, runs the admin bootstrap, attaches Socket.io, and
 * starts listening. App/middleware/route assembly lives in src/app.js.
 */

const http = require('http');
const config = require('./src/config/env');
const connectDB = require('./src/config/db');
const { runBootstrap } = require('./src/utils/bootstrap');
const { setupTeamChat } = require('./src/sockets/teamChat');
const app = require('./src/app');

const startServer = async () => {
  await connectDB();
  await runBootstrap();

  // Create HTTP server (required for Socket.io to share the same port)
  const httpServer = http.createServer(app);

  // Attach Socket.io for realtime team chat + notifications
  setupTeamChat(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`💬 Socket.io active (team chat + notifications)`);
    console.log(`🚀 Ready to accept requests`);
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
