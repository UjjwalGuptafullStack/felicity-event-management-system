const request = require('supertest');
const app = require('../src/app');
const Organizer = require('../src/models/Organizer');
const { hashPassword } = require('../src/utils/authHelpers');

const dayFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

async function createLoggedInOrganizer() {
  const organizer = await Organizer.create({
    name: 'Test Robotics Club',
    category: 'technical',
    contactEmail: 'robotics@example.com',
    loginEmail: 'robotics@clubs.convene.test',
    passwordHash: await hashPassword('OrganizerPass123'),
    isActive: true
  });

  const loginRes = await request(app)
    .post('/auth/organizer/login')
    .send({ email: organizer.loginEmail, password: 'OrganizerPass123' });

  return { organizer, token: loginRes.body.token };
}

async function registerAndLoginParticipant(email = 'participant@example.com') {
  await request(app).post('/auth/participant/register').send({
    firstName: 'Grace',
    lastName: 'Hopper',
    email,
    password: 'ParticipantPass123'
  });

  const loginRes = await request(app)
    .post('/auth/participant/login')
    .send({ email, password: 'ParticipantPass123' });

  return loginRes.body.token;
}

describe('Event registration', () => {
  it('lets an organizer create and publish an event, and a participant register for it', async () => {
    const { token: organizerToken } = await createLoggedInOrganizer();

    const createRes = await request(app)
      .post('/organizer/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Intro to Robotics Workshop',
        type: 'normal',
        categories: ['tech'],
        registrationDeadline: dayFromNow(1),
        startDate: dayFromNow(2),
        endDate: dayFromNow(2),
        registrationLimit: 50
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.event.status).toBe('draft');
    const eventId = createRes.body.event.id;

    const publishRes = await request(app)
      .post(`/organizer/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.event.status).toBe('published');

    const participantToken = await registerAndLoginParticipant();

    const regRes = await request(app)
      .post(`/participant/events/${eventId}/register`)
      .set('Authorization', `Bearer ${participantToken}`);

    expect(regRes.status).toBe(201);
    expect(regRes.body.ticket.ticketId).toMatch(/^TKT-/);

    // Duplicate registration is rejected
    const dupRes = await request(app)
      .post(`/participant/events/${eventId}/register`)
      .set('Authorization', `Bearer ${participantToken}`);
    expect(dupRes.status).toBe(400);
  });

  it('rejects registering for a draft (unpublished) event', async () => {
    const { token: organizerToken } = await createLoggedInOrganizer();

    const createRes = await request(app)
      .post('/organizer/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Unpublished Event',
        type: 'normal',
        registrationDeadline: dayFromNow(1),
        startDate: dayFromNow(2),
        endDate: dayFromNow(2)
      });
    const eventId = createRes.body.event.id;

    const participantToken = await registerAndLoginParticipant('another@example.com');
    const regRes = await request(app)
      .post(`/participant/events/${eventId}/register`)
      .set('Authorization', `Bearer ${participantToken}`);

    expect(regRes.status).toBe(400);
  });

});

describe('Organizer category enum (regression test)', () => {
  // Previously, the admin UI offered categories like "Literary & Debate" that
  // didn't exist in the backend's Mongoose enum, so creating a club with one
  // of them 500'd. Both sides now derive from the same canonical list.
  async function loginAsAdmin() {
    const User = require('../src/models/User');
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
    return res.body.token;
  }

  it('accepts every category the admin UI actually offers', async () => {
    const adminToken = await loginAsAdmin();

    const res = await request(app)
      .post('/admin/organizers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Debate Society',
        category: 'literary-debate',
        contactEmail: 'debate@example.com'
      });

    expect(res.status).toBe(201);
    expect(res.body.organizer.category).toBe('literary-debate');
  });

  it('rejects a category outside the canonical list', async () => {
    const adminToken = await loginAsAdmin();

    const res = await request(app)
      .post('/admin/organizers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Mystery Club',
        category: 'not-a-real-category',
        contactEmail: 'mystery@example.com'
      });

    expect(res.status).toBe(400);
  });
});
