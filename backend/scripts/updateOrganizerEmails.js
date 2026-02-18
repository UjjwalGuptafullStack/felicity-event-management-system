/**
 * Migration Script: Update Organizer Email Domains
 * 
 * Updates all organizer loginEmail addresses from @organizer.felicity.iiit.ac.in to @iiit.ac.in
 * Run with: node scripts/updateOrganizerEmails.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Organizer = require('../src/models/Organizer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity-events';

async function updateOrganizerEmails() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📝 Fetching all organizers...');
    const organizers = await Organizer.find({});
    console.log(`Found ${organizers.length} organizers`);

    if (organizers.length === 0) {
      console.log('No organizers to update.');
      await mongoose.connection.close();
      return;
    }

    console.log('\n🔄 Updating email domains...\n');
    let updatedCount = 0;

    for (const organizer of organizers) {
      const oldEmail = organizer.loginEmail;

      // Check if email needs updating
      if (oldEmail.includes('@organizer.felicity.iiit.ac.in')) {
        // Extract the local part (before @)
        const localPart = oldEmail.split('@')[0];
        const newEmail = `${localPart}@iiit.ac.in`;

        // Update the organizer
        organizer.loginEmail = newEmail;
        await organizer.save();

        console.log(`✓ Updated: ${oldEmail} → ${newEmail}`);
        updatedCount++;
      } else if (oldEmail.endsWith('@iiit.ac.in')) {
        console.log(`⊙ Skipped (already correct): ${oldEmail}`);
      } else {
        console.log(`⚠ Skipped (unknown format): ${oldEmail}`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updatedCount} organizers`);
    console.log(`   Total: ${organizers.length} organizers`);

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
updateOrganizerEmails();
