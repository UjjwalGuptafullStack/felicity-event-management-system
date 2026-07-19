const request = require('supertest');
const app = require('../src/app');
const Organizer = require('../src/models/Organizer');
const { hashPassword } = require('../src/utils/authHelpers');

const dayFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

async function setupPublishedEventWithRegistration() {
  const organizer = await Organizer.create({
    name: 'Test Sports Council',
    category: 'sports',
    contactEmail: 'sports@example.com',
    loginEmail: 'sports@clubs.convene.test',
    passwordHash: await hashPassword('OrganizerPass123'),
    isActive: true
  });
  const organizerLogin = await request(app)
    .post('/auth/organizer/login')
    .send({ email: organizer.loginEmail, password: 'OrganizerPass123' });
  const organizerToken = organizerLogin.body.token;

  const createRes = await request(app)
    .post('/organizer/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({
      name: 'Test Tournament',
      type: 'normal',
      registrationDeadline: dayFromNow(1),
      startDate: dayFromNow(2),
      endDate: dayFromNow(2)
    });
  const eventId = createRes.body.event.id;

  await request(app)
    .post(`/organizer/events/${eventId}/publish`)
    .set('Authorization', `Bearer ${organizerToken}`);

  await request(app).post('/auth/participant/register').send({
    firstName: 'Alan',
    lastName: 'Turing',
    email: 'alan@example.com',
    password: 'ParticipantPass123'
  });
  const participantLogin = await request(app)
    .post('/auth/participant/login')
    .send({ email: 'alan@example.com', password: 'ParticipantPass123' });

  const regRes = await request(app)
    .post(`/participant/events/${eventId}/register`)
    .set('Authorization', `Bearer ${participantLogin.body.token}`);

  return { organizerToken, eventId, ticketId: regRes.body.ticket.ticketId };
}

describe('Attendance scanning', () => {
  it('checks a participant in via their ticket QR code', async () => {
    const { organizerToken, eventId, ticketId } = await setupPublishedEventWithRegistration();

    const scanRes = await request(app)
      .post(`/organizer/events/${eventId}/attendance/scan`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ qrCode: ticketId });

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.success).toBe(true);
  });

  it('rejects scanning the same ticket twice', async () => {
    const { organizerToken, eventId, ticketId } = await setupPublishedEventWithRegistration();

    await request(app)
      .post(`/organizer/events/${eventId}/attendance/scan`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ qrCode: ticketId });

    const secondScan = await request(app)
      .post(`/organizer/events/${eventId}/attendance/scan`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ qrCode: ticketId });

    expect(secondScan.status).toBe(400);
  });

  it('rejects an unknown QR code', async () => {
    const { organizerToken, eventId } = await setupPublishedEventWithRegistration();

    const res = await request(app)
      .post(`/organizer/events/${eventId}/attendance/scan`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ qrCode: 'TKT-DOESNOTEXIST' });

    expect(res.status).toBe(404);
  });

  it('an organizer cannot scan tickets for another organizer\'s event', async () => {
    const { eventId, ticketId } = await setupPublishedEventWithRegistration();

    const otherOrganizer = await Organizer.create({
      name: 'Rival Club',
      category: 'cultural',
      contactEmail: 'rival@example.com',
      loginEmail: 'rival@clubs.convene.test',
      passwordHash: await hashPassword('OrganizerPass123'),
      isActive: true
    });
    const otherLogin = await request(app)
      .post('/auth/organizer/login')
      .send({ email: otherOrganizer.loginEmail, password: 'OrganizerPass123' });

    const res = await request(app)
      .post(`/organizer/events/${eventId}/attendance/scan`)
      .set('Authorization', `Bearer ${otherLogin.body.token}`)
      .send({ qrCode: ticketId });

    expect(res.status).toBe(403);
  });
});
