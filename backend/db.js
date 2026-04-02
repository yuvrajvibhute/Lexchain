const mongoose = require('mongoose');
const { Evidence } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lexchain";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected successfully!');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const seedDatabase = async (MOCK_EVIDENCE) => {
    try {
        const count = await Evidence.countDocuments();
        if (count === 0) {
            console.log('Seeding initial evidence data...');
            await Evidence.insertMany(MOCK_EVIDENCE);
            console.log('Database seeded successfully!');
        }
    } catch (err) {
        console.error('Error seeding database:', err);
    }
};

module.exports = { connectDB, seedDatabase };
