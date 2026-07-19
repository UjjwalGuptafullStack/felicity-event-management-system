/**
 * Global test setup — spins up an in-memory MongoDB instance and points the
 * app's config at it before any test file (or the app itself) is required,
 * so tests never touch a real database.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRY = '1h';
process.env.BCRYPT_ROUNDS = '4'; // faster hashing in tests
process.env.ADMIN_EMAIL = 'admin@convene.test';
process.env.ADMIN_PASSWORD = 'TestAdminPassword123!';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
}, 60000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});
