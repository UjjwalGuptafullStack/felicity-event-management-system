const request = require('supertest');
const app = require('../src/app');

describe('Auth', () => {
  const participant = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    password: 'SuperSecret123',
    contactNumber: '9999999999'
  };

  it('registers a new participant and returns a token', async () => {
    const res = await request(app).post('/auth/participant/register').send(participant);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(participant.email);
    expect(res.body.user.participantType).toBe('general');
  });

  it('rejects registering the same email twice', async () => {
    await request(app).post('/auth/participant/register').send(participant);
    const res = await request(app).post('/auth/participant/register').send(participant);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration with missing required fields', async () => {
    const res = await request(app).post('/auth/participant/register').send({ email: 'incomplete@example.com' });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    await request(app).post('/auth/participant/register').send(participant);

    const res = await request(app)
      .post('/auth/participant/login')
      .send({ email: participant.email, password: participant.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects login with the wrong password', async () => {
    await request(app).post('/auth/participant/register').send(participant);

    const res = await request(app)
      .post('/auth/participant/login')
      .send({ email: participant.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('logs in the bootstrapped-style admin account created directly for the test', async () => {
    // Admin accounts have no self-registration endpoint (by design — see
    // docs/ARCHITECTURE.md), so we create one directly via the model, the
    // same way utils/bootstrap.js does on server boot.
    const User = require('../src/models/User');
    const { hashPassword } = require('../src/utils/authHelpers');

    await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@convene.test',
      passwordHash: await hashPassword('TestAdminPassword123!'),
      role: 'admin'
    });

    const res = await request(app)
      .post('/auth/admin/login')
      .send({ email: 'admin@convene.test', password: 'TestAdminPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  describe('self-service password reset', () => {
    it('always returns a generic success message, even for an unknown email', async () => {
      const res = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nobody@example.com', actorType: 'participant' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('issues a working reset token for a real participant', async () => {
      await request(app).post('/auth/participant/register').send(participant);

      const PasswordResetToken = require('../src/models/PasswordResetToken');
      const crypto = require('crypto');

      await request(app)
        .post('/auth/forgot-password')
        .send({ email: participant.email, actorType: 'participant' });

      const tokenDoc = await PasswordResetToken.findOne({});
      expect(tokenDoc).toBeTruthy();

      // We only have the hash (the raw token was emailed, not persisted) —
      // reconstruct a fresh raw token/hash pair and swap it in to simulate
      // "the user clicked the emailed link", which is the part actually
      // worth testing here (that reset-password correctly consumes a token).
      const rawToken = 'test-raw-token';
      tokenDoc.tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await tokenDoc.save();

      const resetRes = await request(app)
        .post('/auth/reset-password')
        .send({ token: rawToken, actorType: 'participant', newPassword: 'BrandNewPassword123' });

      expect(resetRes.status).toBe(200);

      const loginRes = await request(app)
        .post('/auth/participant/login')
        .send({ email: participant.email, password: 'BrandNewPassword123' });
      expect(loginRes.status).toBe(200);

      // Token is single-use
      const reuseRes = await request(app)
        .post('/auth/reset-password')
        .send({ token: rawToken, actorType: 'participant', newPassword: 'AnotherPassword123' });
      expect(reuseRes.status).toBe(400);
    });

    it('rejects an invalid reset token', async () => {
      const res = await request(app)
        .post('/auth/reset-password')
        .send({ token: 'not-a-real-token', actorType: 'participant', newPassword: 'BrandNewPassword123' });

      expect(res.status).toBe(400);
    });
  });
});
