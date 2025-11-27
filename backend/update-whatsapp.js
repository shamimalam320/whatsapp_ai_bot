const mongoose = require('mongoose');
require('dotenv').config();

// Business Schema
const businessSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  address: String,
  whatsappNumber: String,
  userId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const Business = mongoose.model('Business', businessSchema);

async function updateBusiness() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find business
    const business = await Business.findOne();
    
    if (!business) {
      console.log('❌ No business found in database');
      process.exit(1);
    }

    console.log('\n📊 Current Business Info:');
    console.log('- Name:', business.name);
    console.log('- Email:', business.email);
    console.log('- Current WhatsApp:', business.whatsappNumber || 'Not set');

    // Update WhatsApp number
    business.whatsappNumber = 'whatsapp:+14155238886';
    await business.save();

    console.log('\n✅ Business Updated Successfully!');
    console.log('- Name:', business.name);
    console.log('- WhatsApp Number:', business.whatsappNumber);
    console.log('\n🎉 You can now receive WhatsApp messages!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateBusiness();
