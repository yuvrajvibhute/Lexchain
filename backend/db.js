const mongoose = require('mongoose');
const { Evidence } = require('./models');
const { MongoMemoryServer } = require('mongodb-memory-server');

let MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        if (!MONGODB_URI) {
            console.log('No MONGODB_URI found. Starting locally embedded MongoDB Memory Server...');
            const mongoServer = await MongoMemoryServer.create();
            MONGODB_URI = mongoServer.getUri();
        }
        await mongoose.connect(MONGODB_URI);
        console.log(`MongoDB Connected successfully! (${MONGODB_URI})`);
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
