/**
 * Felicity Event Management System — Database Seed Script
 *
 * Creates pre-existing clubs (organizers) and realistic events.
 * Safe to re-run: organizers are matched by loginEmail; duplicate events
 * (same name + organizer) are skipped.
 *
 * Usage:
 *   node backend/scripts/seed.js
 * or (from backend/ directory):
 *   node scripts/seed.js
 *
 * Seed credentials for all clubs: Felicity@2025
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

/* ─── Models ─────────────────────────────────────────────────────── */
const Organizer = require('../src/models/Organizer');
const Event     = require('../src/models/Event');

/* ─── Helpers ─────────────────────────────────────────────────────── */
const SEED_PASSWORD    = 'Felicity@2025';
const BCRYPT_ROUNDS    = parseInt(process.env.BCRYPT_ROUNDS) || 10;
const MONGODB_URI      = process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity-events';

/** Relative date helper — returns a Date N days from Feb 22 2026 */
const ref = new Date('2026-02-22T00:00:00.000Z');
const daysFrom = (n) => new Date(ref.getTime() + n * 86_400_000);

/* ─── Clubs ─────────────────────────────────────────────────────────
 * Eight active student organisations at IIIT-H. loginEmail follows the
 * approved convention: <slug>@clubs.iiit.ac.in
 ─────────────────────────────────────────────────────────────────── */
const CLUBS = [
  {
    name:         'ACM IIIT-H',
    category:     'technical',
    description:  'The IIIT-H chapter of the Association for Computing Machinery. We organise hackathons, coding contests, guest lectures, and hands-on workshops covering algorithms, AI/ML, and systems programming.',
    contactEmail: 'acm@iiit.ac.in',
    contactNumber: '040-66531000',
    loginEmail:   'acm-iiith@clubs.iiit.ac.in',
  },
  {
    name:         'Felicity Cultural Fest Committee',
    category:     'cultural',
    description:  "The organising body behind Felicity — IIIT-H's annual techno-cultural festival. We coordinate performing arts, fine arts, literary events, and star nights across the two-day fest.",
    contactEmail: 'felicity@iiit.ac.in',
    contactNumber: '040-66531001',
    loginEmail:   'felicity-fest@clubs.iiit.ac.in',
  },
  {
    name:         'Sports Council IIIT-H',
    category:     'sports',
    description:  'The apex body for sports at IIIT-H. We run inter-hostel leagues, represent IIIT in inter-collegiate tournaments, and maintain all sports facilities on campus.',
    contactEmail: 'sports@iiit.ac.in',
    contactNumber: '040-66531002',
    loginEmail:   'sports-council@clubs.iiit.ac.in',
  },
  {
    name:         'Shutterbug Photography Club',
    category:     'cultural',
    description:  "IIIT-H's photography and videography club. We conduct photo walks, portrait sessions, editing workshops, and curate the annual campus photo exhibition.",
    contactEmail: 'shutterbug@students.iiit.ac.in',
    contactNumber: '040-66531003',
    loginEmail:   'shutterbug@clubs.iiit.ac.in',
  },
  {
    name:         'E-Cell IIIT-H',
    category:     'social',
    description:  'The Entrepreneurship Cell of IIIT-H. We foster the startup culture through pitch competitions, founder talks, startup weekends, and incubation support for student ventures.',
    contactEmail: 'ecell@iiit.ac.in',
    contactNumber: '040-66531004',
    loginEmail:   'ecell-iiith@clubs.iiit.ac.in',
  },
  {
    name:         'Literary Club IIIT-H',
    category:     'academic',
    description:  'A club for language, literature, and debate enthusiasts. We host creative writing contests, inter-college quizzes, English and Hindi debates, and poetry slam events.',
    contactEmail: 'litclub@students.iiit.ac.in',
    contactNumber: '040-66531005',
    loginEmail:   'literary-club@clubs.iiit.ac.in',
  },
  {
    name:         'Radiance Music Club',
    category:     'cultural',
    description:  "IIIT-H's official music club. From classical recitals to rock jams, we celebrate every genre. We organise open mics, Battle of Bands, studio workshops, and the annual Radiance concert.",
    contactEmail: 'radiance@students.iiit.ac.in',
    contactNumber: '040-66531006',
    loginEmail:   'radiance@clubs.iiit.ac.in',
  },
  {
    name:         'Robotics Club IIIT-H',
    category:     'technical',
    description:  'We build robots, drones, and autonomous systems. The club runs RoboWars (combat robotics), line-following races, drone-piloting sessions, and embedded-systems workshops.',
    contactEmail: 'robotics@iiit.ac.in',
    contactNumber: '040-66531007',
    loginEmail:   'robotics-club@clubs.iiit.ac.in',
  },
];

/* ─── Events factory ─────────────────────────────────────────────────
 * Each entry is a function that receives the organizer ObjectId and
 * returns an Event document object (without _id).
 * Events span past, current, and future dates relative to Feb 22 2026.
 ─────────────────────────────────────────────────────────────────── */
const eventFactories = {

  // ── ACM IIIT-H ──────────────────────────────────────────────────
  'acm-iiith@clubs.iiit.ac.in': (orgId) => [
    {
      name:                 'HackIIIT 2025',
      description:          'The flagship 24-hour hackathon of IIIT-H. Teams of 2–4 compete across tracks: AI/ML, Web3, Systems, and Open Innovation. Prizes worth ₹1,00,000. Meals and swag included.',
      type:                 'normal',
      categories:           ['tech'],
      eligibility:          'Open to all IIIT-H students and students from any college.',
      registrationDeadline: daysFrom(-145),
      startDate:            daysFrom(-144),
      endDate:              daysFrom(-143),
      registrationLimit:    200,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['hackathon', 'coding', 'ai', 'web3'],
      status:               'published',
      teamRegistration: { enabled: true, minSize: 2, maxSize: 4 },
    },
    {
      name:                 'Code Sprint — March 2026',
      description:          'A 3-hour competitive programming contest on Codeforces. Problems range from Div. 2 C to Div. 1 B difficulty. Individual participation. Rating-eligible for regular contestants.',
      type:                 'normal',
      categories:           ['tech'],
      eligibility:          'iiit',
      registrationDeadline: daysFrom(18),
      startDate:            daysFrom(21),
      endDate:              daysFrom(21),
      registrationLimit:    150,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['competitive programming', 'codeforces', 'algorithms'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
    {
      name:                 'Deep Learning Workshop Series',
      description:          'A 5-session hands-on workshop covering neural networks from scratch to fine-tuning large models. PyTorch-based. Bring your own laptop; GPU access provided via Google Colab.',
      type:                 'normal',
      categories:           ['tech'],
      eligibility:          'Open to all',
      registrationDeadline: daysFrom(-3),
      startDate:            daysFrom(-2),
      endDate:              daysFrom(12),
      registrationLimit:    60,
      registrationFee:      200,
      organizerId:          orgId,
      tags:                 ['deep learning', 'pytorch', 'ai', 'workshop'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
  ],

  // ── Felicity Cultural Fest Committee ────────────────────────────
  'felicity-fest@clubs.iiit.ac.in': (orgId) => [
    {
      name:                 'Felicity 2025 — Day 1: Cultural Night',
      description:          'The opening night of Felicity 2025 featuring classical dance performances, drama by the IIIT-H theatre group, and a stand-up comedy act. Entry via registration.',
      type:                 'normal',
      categories:           ['cultural'],
      eligibility:          'Open to all',
      registrationDeadline: daysFrom(-100),
      startDate:            daysFrom(-99),
      endDate:              daysFrom(-99),
      registrationLimit:    500,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['felicity', 'dance', 'drama', 'cultural night'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
    {
      name:                 'Fine Arts Competition — Felicity 2026',
      description:          'On-the-spot painting, digital art, and sculpture categories. Themes revealed on the day. Prizes for college-level and school-level participants separately.',
      type:                 'normal',
      categories:           ['cultural'],
      eligibility:          'Open to all',
      registrationDeadline: daysFrom(27),
      startDate:            daysFrom(30),
      endDate:              daysFrom(30),
      registrationLimit:    80,
      registrationFee:      50,
      organizerId:          orgId,
      tags:                 ['art', 'painting', 'felicity', 'competition'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
    {
      name:                 'Dance War — Felicity 2026',
      description:          'Group dance competition across Classical, Bollywood, and Contemporary categories. Teams of 6–12 perform for 8 minutes. ₹30,000 prize pool.',
      type:                 'normal',
      categories:           ['cultural'],
      eligibility:          'Open to all college students',
      registrationDeadline: daysFrom(28),
      startDate:            daysFrom(31),
      endDate:              daysFrom(31),
      registrationLimit:    20,
      registrationFee:      300,
      organizerId:          orgId,
      tags:                 ['dance', 'group dance', 'felicity', 'bollywood', 'classical'],
      status:               'published',
      teamRegistration: { enabled: true, minSize: 6, maxSize: 12 },
    },
  ],

  // ── Sports Council ───────────────────────────────────────────────
  'sports-council@clubs.iiit.ac.in': (orgId) => [
    {
      name:                 'Inter-Hostel Cricket Tournament 2026',
      description:          'Annual 20-over cricket tournament among IIIT-H hostels. Knockout format, 8-team draw. Played on the main cricket ground. Umpires provided. Helmets and pads available.',
      type:                 'normal',
      categories:           ['sports'],
      eligibility:          'iiit',
      registrationDeadline: daysFrom(20),
      startDate:            daysFrom(26),
      endDate:              daysFrom(33),
      registrationLimit:    24,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['cricket', 'inter-hostel', 'sports', 'tournament'],
      status:               'published',
      teamRegistration: { enabled: true, minSize: 11, maxSize: 15 },
    },
    {
      name:                 'IIIT Badminton Open 2026',
      description:          'Singles and doubles badminton tournament open to IIIT students and staff. Round-robin group stage followed by knock-out. Register individually or as a pair.',
      type:                 'normal',
      categories:           ['sports'],
      eligibility:          'iiit',
      registrationDeadline: daysFrom(37),
      startDate:            daysFrom(40),
      endDate:              daysFrom(42),
      registrationLimit:    64,
      registrationFee:      100,
      organizerId:          orgId,
      tags:                 ['badminton', 'sports', 'open'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 2 },
    },
    {
      name:                 'Inter-collegiate Football Fest 2026',
      description:          'IIIT-H invites college football teams for a 3-day tournament. 7-a-side format on astroturf. Registration per team; each team nominates a manager who receives credentials.',
      type:                 'normal',
      categories:           ['sports'],
      eligibility:          'Open to all college students',
      registrationDeadline: daysFrom(53),
      startDate:            daysFrom(56),
      endDate:              daysFrom(58),
      registrationLimit:    16,
      registrationFee:      1000,
      organizerId:          orgId,
      tags:                 ['football', 'inter-collegiate', 'sports'],
      status:               'published',
      teamRegistration: { enabled: true, minSize: 7, maxSize: 10 },
    },
  ],

  // ── Shutterbug Photography Club ──────────────────────────────────
  'shutterbug@clubs.iiit.ac.in': (orgId) => [
    {
      name:                 'Annual Photo Exhibition 2025',
      description:          'Display of the best 60 photographs taken by IIIT students in 2025. Themes: People, Architecture, Nature, Abstract. Judged by a panel of professional photographers.',
      type:                 'normal',
      categories:           ['cultural'],
      eligibility:          'Open to all',
      registrationDeadline: daysFrom(-55),
      startDate:            daysFrom(-54),
      endDate:              daysFrom(-52),
      registrationLimit:    null,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['photography', 'exhibition', 'art'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
    {
      name:                 'Campus PhotoWalk — March 2026',
      description:          'A guided 2-hour golden-hour walk through IIIT-H campus with peer critique sessions. DSLR, mirrorless, or phone camera welcome. Best shot wins a print voucher.',
      type:                 'normal',
      categories:           ['cultural'],
      eligibility:          'iiit',
      registrationDeadline: daysFrom(6),
      startDate:            daysFrom(8),
      endDate:              daysFrom(8),
      registrationLimit:    30,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['photography', 'photo walk', 'campus'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
    {
      name:                 'Shutterbug Merchandise 2026',
      description:          'Limited-edition Shutterbug club merchandise — printed hardcover photo book, enamel pin set, and tote bag. Pre-order only; items shipped after event closes.',
      type:                 'merchandise',
      categories:           ['cultural'],
      eligibility:          'Open to all',
      registrationDeadline: daysFrom(35),
      startDate:            daysFrom(38),
      endDate:              daysFrom(50),
      registrationLimit:    100,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['merchandise', 'photography', 'photo book'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
      merchandiseDetails: {
        items: [
          {
            name:        'Shutterbug Photo Book 2026',
            description: 'A4 hardcover, 80 pages, premium print of campus photographs.',
            variants: [
              { type: 'Standard', stock: 60, price: 350 },
            ],
          },
          {
            name:        'Enamel Pin Set',
            description: 'Set of 3 camera-themed enamel pins.',
            variants: [
              { type: 'Set of 3', stock: 80, price: 150 },
            ],
          },
          {
            name:        'Canvas Tote Bag',
            description: 'Natural canvas tote with Shutterbug logo.',
            variants: [
              { type: 'One Size', stock: 50, price: 200 },
            ],
          },
        ],
        perUserLimit:     2,
        requiresApproval: true,
      },
    },
  ],

  // ── E-Cell IIIT-H ────────────────────────────────────────────────
  'ecell-iiith@clubs.iiit.ac.in': (orgId) => [
    {
      name:                 'Startup Pitch Day — Jan 2026',
      description:          'Students pitch their startup ideas to a panel of investors and founders in a Shark Tank–style format. Top 3 pitches receive mentorship grants and co-working space credits.',
      type:                 'normal',
      categories:           ['social'],
      eligibility:          'iiit',
      registrationDeadline: daysFrom(-42),
      startDate:            daysFrom(-38),
      endDate:              daysFrom(-38),
      registrationLimit:    40,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['startup', 'pitch', 'entrepreneurship', 'investors'],
      status:               'published',
      teamRegistration: { enabled: true, minSize: 2, maxSize: 4 },
    },
    {
      name:                 'Entrepreneur Talk Series — March 2026',
      description:          'Monthly fireside chat with a founder. March edition features the co-founder of a Y-Combinator–backed startup. Open Q&A for 30 minutes after the 45-minute conversation.',
      type:                 'normal',
      categories:           ['social'],
      eligibility:          'Open to all IIIT students and faculty',
      registrationDeadline: daysFrom(18),
      startDate:            daysFrom(20),
      endDate:              daysFrom(20),
      registrationLimit:    120,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['talk', 'founder', 'startup', 'entrepreneurship'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
  ],

  // ── Literary Club IIIT-H ─────────────────────────────────────────
  'literary-club@clubs.iiit.ac.in': (orgId) => [
    {
      name:                 'Quizosphere 2026 — Inter-college Quiz',
      description:          'Premier general knowledge and current affairs quiz. Six rounds covering science, technology, pop culture, history, and sports. Teams of 3. ₹20,000 prize pool.',
      type:                 'normal',
      categories:           ['academic'],
      eligibility:          'Open to all college students',
      registrationDeadline: daysFrom(12),
      startDate:            daysFrom(15),
      endDate:              daysFrom(15),
      registrationLimit:    50,
      registrationFee:      200,
      organizerId:          orgId,
      tags:                 ['quiz', 'inter-college', 'general knowledge'],
      status:               'published',
      teamRegistration: { enabled: true, minSize: 3, maxSize: 3 },
    },
    {
      name:                 'Creative Writing Marathon',
      description:          "A 6-hour timed creative writing event. Three genres: short story, flash fiction, poetry. Submit digitally. Judged on creativity, grammar, and originality. Winners published in the club's annual journal.",
      type:                 'normal',
      categories:           ['academic'],
      eligibility:          'iiit',
      registrationDeadline: daysFrom(22),
      startDate:            daysFrom(25),
      endDate:              daysFrom(25),
      registrationLimit:    60,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['writing', 'short story', 'poetry', 'competition'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
    {
      name:                 'Debate Clash — April 2026',
      description:          'British Parliamentary style debate tournament. Motions released 15 minutes before each round. Teams of 2 for opening government, opening opposition, closing government, closing opposition.',
      type:                 'normal',
      categories:           ['academic'],
      eligibility:          'Open to all',
      registrationDeadline: daysFrom(37),
      startDate:            daysFrom(40),
      endDate:              daysFrom(41),
      registrationLimit:    32,
      registrationFee:      150,
      organizerId:          orgId,
      tags:                 ['debate', 'public speaking', 'BP debate'],
      status:               'published',
      teamRegistration: { enabled: true, minSize: 2, maxSize: 2 },
    },
  ],

  // ── Radiance Music Club ──────────────────────────────────────────
  'radiance@clubs.iiit.ac.in': (orgId) => [
    {
      name:                 'Battle of Bands — March 2026',
      description:          "IIIT-H's flagship band competition. Bands of 3\u20136 perform original or cover songs for 12 minutes. Genres open. Judges include professional musicians. \u20B925,000 prize pool.",
      type:                 'normal',
      categories:           ['cultural'],
      eligibility:          'Open to all college bands',
      registrationDeadline: daysFrom(23),
      startDate:            daysFrom(27),
      endDate:              daysFrom(27),
      registrationLimit:    12,
      registrationFee:      500,
      organizerId:          orgId,
      tags:                 ['music', 'band', 'competition', 'battle of bands'],
      status:               'published',
      teamRegistration: { enabled: true, minSize: 3, maxSize: 6 },
    },
    {
      name:                 'Open Mic Night — February 2026',
      description:          'A relaxed open mic featuring solo and duo performances. Vocals, instruments, spoken word welcome. Slots of 5 minutes each. IIIT students get priority; external artists welcome if slots remain.',
      type:                 'normal',
      categories:           ['cultural'],
      eligibility:          'Open to all',
      registrationDeadline: daysFrom(1),
      startDate:            daysFrom(4),
      endDate:              daysFrom(4),
      registrationLimit:    25,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['open mic', 'music', 'spoken word', 'vocal'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
    {
      name:                 'Radiance Annual Concert 2026',
      description:          'The biggest music event of the year at IIIT-H. Featuring student bands, invited professional acts, and an EDM set. Ticketed event with limited seats. Food and beverages available.',
      type:                 'normal',
      categories:           ['cultural'],
      eligibility:          'Open to all',
      registrationDeadline: daysFrom(50),
      startDate:            daysFrom(53),
      endDate:              daysFrom(53),
      registrationLimit:    600,
      registrationFee:      299,
      organizerId:          orgId,
      tags:                 ['concert', 'music', 'annual', 'live music'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
  ],

  // ── Robotics Club IIIT-H ─────────────────────────────────────────
  'robotics-club@clubs.iiit.ac.in': (orgId) => [
    {
      name:                 'RoboWars 2026',
      description:          'Combat robot competition. Build a 3 kg robot and battle in the arena. Full-contact bouts, round-robin + knockout format. Robots must pass technical inspection. Spare parts available at the venue.',
      type:                 'normal',
      categories:           ['tech'],
      eligibility:          'Open to all college students',
      registrationDeadline: daysFrom(42),
      startDate:            daysFrom(47),
      endDate:              daysFrom(48),
      registrationLimit:    32,
      registrationFee:      500,
      organizerId:          orgId,
      tags:                 ['robotics', 'robowars', 'competition', 'makers'],
      status:               'published',
      teamRegistration: { enabled: true, minSize: 2, maxSize: 5 },
    },
    {
      name:                 'Arduino Bootcamp — March 2026',
      description:          'Weekend beginner bootcamp: from zero to blinking LEDs, sensors, and servo motors. All components provided. Participants keep the Arduino Uno kit. Limited to 40 seats.',
      type:                 'normal',
      categories:           ['tech'],
      eligibility:          'iiit',
      registrationDeadline: daysFrom(10),
      startDate:            daysFrom(14),
      endDate:              daysFrom(15),
      registrationLimit:    40,
      registrationFee:      400,
      organizerId:          orgId,
      tags:                 ['arduino', 'embedded systems', 'workshop', 'beginners'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
    },
    {
      name:                 'Robotics Merch Drop 2026',
      description:          'Official Robotics Club merchandise: circuit-board print T-shirts, 3D-printed rover keychain, and a sticker pack. Limited quantities — order early.',
      type:                 'merchandise',
      categories:           ['tech'],
      eligibility:          'Open to all',
      registrationDeadline: daysFrom(30),
      startDate:            daysFrom(33),
      endDate:              daysFrom(45),
      registrationLimit:    null,
      registrationFee:      0,
      organizerId:          orgId,
      tags:                 ['merchandise', 'robotics', 't-shirt'],
      status:               'published',
      teamRegistration: { enabled: false, minSize: 2, maxSize: 5 },
      merchandiseDetails: {
        items: [
          {
            name:        'Circuit Board T-Shirt',
            description: '100% cotton with front-print circuit art. Sizes XS–XXL.',
            variants: [
              { type: 'XS', stock: 15, price: 450 },
              { type: 'S',  stock: 20, price: 450 },
              { type: 'M',  stock: 30, price: 450 },
              { type: 'L',  stock: 25, price: 450 },
              { type: 'XL', stock: 15, price: 450 },
              { type: 'XXL', stock: 10, price: 450 },
            ],
          },
          {
            name:        '3D-Printed Rover Keychain',
            description: 'Miniature Mars-rover model, PLA printed, powder-coated.',
            variants: [
              { type: 'Standard', stock: 60, price: 120 },
            ],
          },
          {
            name:        'Sticker Pack',
            description: '8 vinyl stickers: robots, circuits, and the club logo.',
            variants: [
              { type: 'Pack of 8', stock: 100, price: 80 },
            ],
          },
        ],
        perUserLimit:     3,
        requiresApproval: true,
      },
    },
  ],
};

/* ─── Main ──────────────────────────────────────────────────────── */
async function seed() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  Felicity Event Management System — Seed Script');
  console.log('════════════════════════════════════════════════════\n');

  // Connect
  await mongoose.connect(MONGODB_URI);
  console.log(`✔  Connected to MongoDB: ${MONGODB_URI}\n`);

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);
  console.log('✔  Seed password hashed (Felicity@2025)\n');

  let createdClubs  = 0;
  let skippedClubs  = 0;
  let createdEvents = 0;
  let skippedEvents = 0;

  for (const clubData of CLUBS) {
    /* ── Upsert organizer ── */
    let organizer = await Organizer.findOne({ loginEmail: clubData.loginEmail });

    if (organizer) {
      console.log(`  ⏭  Club already exists: ${clubData.name}`);
      skippedClubs++;
    } else {
      organizer = await Organizer.create({ ...clubData, passwordHash, isActive: true });
      console.log(`  ✔  Created club: ${organizer.name}  (login: ${organizer.loginEmail})`);
      createdClubs++;
    }

    /* ── Create events for this organizer ── */
    const factory = eventFactories[clubData.loginEmail];
    if (!factory) continue;

    const eventDefs = factory(organizer._id);

    for (const def of eventDefs) {
      const existing = await Event.findOne({
        organizerId: organizer._id,
        name:        def.name,
      });

      if (existing) {
        console.log(`     ⏭  Event already exists: "${def.name}"`);
        skippedEvents++;
      } else {
        await Event.create(def);
        console.log(`     ✔  Created event: "${def.name}"`);
        createdEvents++;
      }
    }
  }

  console.log('\n────────────────────────────────────────────────────');
  console.log(`  Clubs  — created: ${createdClubs}  skipped: ${skippedClubs}`);
  console.log(`  Events — created: ${createdEvents}  skipped: ${skippedEvents}`);
  console.log('────────────────────────────────────────────────────');
  console.log('\n  Seed credentials for all clubs: Felicity@2025');
  console.log('\n  Login emails:');
  CLUBS.forEach(c => console.log(`    ${c.loginEmail}`));
  console.log('\n════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n✖  Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
