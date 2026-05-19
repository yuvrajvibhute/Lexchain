const os = require('os');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { Evidence } = require('./models');
const { MongoMemoryServer } = require('mongodb-memory-server');

let MONGODB_URI = process.env.MONGODB_URI;

/**
 * Returns a writable temp directory. On Windows, the TEMP env var may point
 * to a non-existent directory (e.g. Java JDK's Temp folder). We try several
 * known locations until we find one that exists.
 */
function getWritableTempDir() {
    const candidates = [
        process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Temp'),
        process.env.USERPROFILE && path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Temp'),
        'C:\\Windows\\Temp',
        path.join(process.cwd(), '.mongo-tmp'),
    ].filter(Boolean);

    for (const dir of candidates) {
        if (dir && fs.existsSync(dir)) return dir;
    }

    // Last resort: create a temp dir inside the project
    const fallback = path.join(process.cwd(), '.mongo-tmp');
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
}

const startInMemory = async () => {
    const tmpDir = getWritableTempDir();
    // Override all TEMP env vars so MongoMemoryServer can use them
    process.env.TEMP = tmpDir;
    process.env.TMP = tmpDir;
    process.env.TMPDIR = tmpDir;
    console.log(`Using temp dir for MongoDB: ${tmpDir}`);
    const mongoServer = await MongoMemoryServer.create();
    return mongoServer;
};

const connectDB = async () => {
    try {
        if (!MONGODB_URI) {
            if (process.env.VERCEL) {
                throw new Error("MONGODB_URI is required on Vercel. MongoMemoryServer cannot run in serverless environments.");
            }
            console.log('No MONGODB_URI found. Starting locally embedded MongoDB Memory Server...');
            const mongoServer = await startInMemory();
            MONGODB_URI = mongoServer.getUri();
            await mongoose.connect(MONGODB_URI);
        } else {
            try {
                await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
            } catch (atlasErr) {
                console.warn('⚠ MongoDB Atlas connection failed:', atlasErr.message);
                if (process.env.VERCEL) {
                    throw new Error("Failed to connect to MongoDB Atlas on Vercel. Ensure your MONGODB_URI is correct and IP access is configured.");
                }
                console.log('Falling back to in-memory MongoDB for demo...');
                const mongoServer = await startInMemory();
                MONGODB_URI = mongoServer.getUri();
                await mongoose.connect(MONGODB_URI);
            }
        }
        console.log('✅ MongoDB Connected successfully!');
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
