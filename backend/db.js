const { loadDatabase, seedAppDatabase } = require('./models');

const connectDB = async () => {
    try {
        await loadDatabase();
        console.log('✅ LexDB (Zero-Setup Embedded Database) Ready!');
        return true;
    } catch (err) {
        console.error('LexDB Initialization Error:', err);
        return true;
    }
};

const seedDatabase = async (MOCK_EVIDENCE) => {
    try {
        await seedAppDatabase(MOCK_EVIDENCE);
    } catch (err) {
        console.error('Error seeding database:', err);
    }
};

module.exports = { connectDB, seedDatabase };
