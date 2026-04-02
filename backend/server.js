const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { connectDB, seedDatabase } = require('./db');
const { Evidence, User, Lawyer, Case, Hearing, CourtOrder, AccessRequest, LawyerRating } = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'nyaya-chain-secret-2024';
const ADMIN_PASSCODE = process.env.VITE_ADMIN_PASSCODE || 'NYAYA2024';
const JUDGE_PASSCODE = process.env.JUDGE_PASSCODE || 'JUDGE2024';

connectDB(); // Connect to MongoDB

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Seed mock data ──────────────────────────────────────────────────────────
const MOCK_EVIDENCE = [
    { id: "EV-2024-001", name: "FIR_Case_2024_Bangalore.pdf", type: "FIR", hash: "0x7f3a9c2e1b84d6f05a", ipfsCid: "QmX9bK2nR7sP4tA3mE6d", uploadedBy: "SI Rajesh Kumar", station: "Koramangala PS", caseNo: "CR-2024-1847", timestamp: "2024-03-15T09:23:11", blockHeight: 19847562, txHash: "0x4a9f2c1b7e3d5a8c0b", status: "verified", chainOfCustody: [{ officer: "HC Priya Sharma", action: "Initial Upload", time: "2024-03-15T09:23:11" }, { officer: "Court Registry", action: "Admitted as Evidence", time: "2024-03-16T14:20:00" }] },
];

async function seedApp() {
    await seedDatabase(MOCK_EVIDENCE);
    // Seed lawyers if empty
    const lawyersCount = await Lawyer.countDocuments();
    if (lawyersCount === 0) {
        const lawyers = [
            { id: 'lawyer_seed_1', userId: 'lawyer_seed_1', name: 'Adv. Priya Krishnamurthy', email: 'priya@lexchain.in', barCouncilId: 'KAR/2015/3421', licenseNo: 'LIC-KA-3421', specialization: 'Criminal Law', experience: 12, fee: 5000, rating: 4.8, ratingCount: 47, courtName: 'Karnataka High Court', city: 'Bangalore', phone: '9876543210', bio: 'Expert in criminal defense and constitutional law.', verified: true },
            { id: 'lawyer_seed_2', userId: 'lawyer_seed_2', name: 'Adv. Rahul Sharma', email: 'rahul@lexchain.in', barCouncilId: 'DL/2018/1234', licenseNo: 'LIC-DL-1234', specialization: 'Civil Law', experience: 7, fee: 3500, rating: 4.5, ratingCount: 29, courtName: 'Delhi High Court', city: 'Delhi', phone: '9876543211', bio: 'Specializes in property disputes and civil matters.', verified: true },
        ];
        await Lawyer.insertMany(lawyers);
    }
}
seedApp();

const upload = multer({ dest: 'uploads/' });

// Helpers ─────────────────────────────────────────────────────────────────
function genCaseId() {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(1000 + Math.random() * 9000));
    return `LCX-${year}-${seq}`;
}
function genBlockchainData() {
    return { txHash: "0x" + crypto.randomBytes(32).toString('hex'), blockHeight: 19851890 + Math.floor(Math.random() * 200), ipfsCid: "Qm" + crypto.randomBytes(22).toString('base64').replace(/[\/\+]/g, 'x') };
}

// EVIDENCE ROUTES ─────────────────────────────────────────────────────────
app.get('/api/evidence', async (req, res) => {
    try {
        const { caseId } = req.query;
        const query = caseId ? { caseId } : {};
        const evidence = await Evidence.find(query).sort({ timestamp: -1 });
        res.json(evidence);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/evidence', upload.single('file'), async (req, res) => {
    try {
        const { name, caseNo, caseId, officer, station, type } = req.body;
        const rawHash = req.body.hash || crypto.randomBytes(32).toString('hex');
        const hash = rawHash.startsWith('0x') ? rawHash : '0x' + rawHash;
        const { txHash, blockHeight, ipfsCid } = genBlockchainData();
        const id = "EV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
        const timestamp = new Date().toISOString();

        const evidence = await Evidence.create({
            id, name, type: type || 'Document', hash, ipfsCid, uploadedBy: officer,
            station, caseNo, caseId: caseId || null, timestamp, blockHeight, txHash,
            status: "verified", courtApproval: "pending",
            chainOfCustody: [{ officer, action: "Initial Upload & Hash Generated", time: timestamp }]
        });
        res.json(evidence);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/evidence/verify/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const e = await Evidence.findOne({ $or: [{ id: identifier }, { hash: identifier }, { txHash: identifier }] });
        if (!e) return res.status(404).json({ error: "Not found" });
        res.json(e);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/evidence/:id/approval', async (req, res) => {
    try {
        const { courtApproval, judgeName } = req.body;
        const officerName = judgeName || 'Court';
        const action = courtApproval === 'approved' ? 'Approved by Court' : 'Rejected by Court';
        
        await Evidence.findOneAndUpdate(
            { id: req.params.id },
            { 
                $set: { courtApproval },
                $push: { chainOfCustody: { officer: officerName, action, time: new Date().toISOString() } }
            }
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// AUTH ROUTES ─────────────────────────────────────────────────────────────
app.post('/api/auth/email', async (req, res) => {
    try {
        const { name, email, role, passcode, city, post, phone, aadhaar, fullAddress } = req.body;
        if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
        if (role === 'admin' && passcode !== ADMIN_PASSCODE) return res.status(401).json({ error: 'Invalid admin passcode' });
        if (role === 'judge' && passcode !== JUDGE_PASSCODE) return res.status(401).json({ error: 'Invalid judge passcode' });
        
        const id = 'email_' + Buffer.from(email.toLowerCase()).toString('hex');
        const user = await User.findOneAndUpdate(
            { id },
            { id, name, email, role: role || 'user', loginMethod: 'email', city, post, phone, aadhaar, fullAddress },
            { upsert: true, new: true }
        );
        const token = jwt.sign(user.toJSON(), JWT_SECRET, { expiresIn: '7d' });
        res.json({ user, token });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/wallet', async (req, res) => {
    try {
        const { address, signature, message, role, name, email, city, post, phone, aadhaar, fullAddress, 
                 barCouncilId, licenseNo, specialization, experience, fee, courtName, passcode } = req.body;
        if (!address || !signature || !message) return res.status(400).json({ error: 'Missing wallet fields' });
        if (role === 'admin' && passcode !== ADMIN_PASSCODE) return res.status(401).json({ error: 'Invalid admin passcode' });
        if (role === 'judge' && passcode !== JUDGE_PASSCODE) return res.status(401).json({ error: 'Invalid judge passcode' });

        const user = await User.findOneAndUpdate(
            { id: address },
            { id: address, address, name, email, role: role || 'user', loginMethod: 'wallet', city, post, phone, aadhaar, fullAddress },
            { upsert: true, new: true }
        );

        if (role === 'lawyer') {
            await Lawyer.findOneAndUpdate(
                { id: address },
                { id: address, userId: address, name, email, barCouncilId: barCouncilId || '', licenseNo: licenseNo || '', 
                  specialization: specialization || 'General', experience: experience || 0, fee: fee || 0, city: city || '', 
                  courtName: courtName || '', verified: false },
                { upsert: true }
            );
        }
        const token = jwt.sign(user.toJSON(), JWT_SECRET, { expiresIn: '7d' });
        res.json({ user, token });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// CASES ROUTES ────────────────────────────────────────────────────────────
app.post('/api/cases', async (req, res) => {
    try {
        const { title, category, description, location, incidentDate, opponentName, opponentContact, filedBy, filedByName } = req.body;
        const id = genCaseId();
        const caseObj = await Case.create({
            id, title, category: category || 'Other', description, location, incidentDate,
            opponentName, opponentContact, filedBy, filedByName, status: 'filed'
        });
        res.json(caseObj);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/cases', async (req, res) => {
    try {
        const { userId, role, lawyerId, judgeId } = req.query;
        let query = {};
        if (role === 'user' && userId) query.filedBy = userId;
        else if (role === 'lawyer' && lawyerId) query.assignedLawyer = lawyerId;
        else if (role === 'judge' && judgeId) query.assignedJudge = judgeId;

        const cases = await Case.find(query).sort({ createdAt: -1 });
        res.json(cases);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/cases/:id', async (req, res) => {
    try {
        const c = await Case.findOne({ id: req.params.id }).lean();
        if (!c) return res.status(404).json({ error: 'Case not found' });
        c.hearings = await Hearing.find({ caseId: c.id }).sort({ hearingDate: 1, hearingTime: 1 });
        c.courtOrders = await CourtOrder.find({ caseId: c.id }).sort({ createdAt: -1 });
        c.evidence = await Evidence.find({ caseId: c.id }).sort({ timestamp: -1 });
        res.json(c);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/cases/:id', async (req, res) => {
    try {
        await Case.findOneAndUpdate({ id: req.params.id }, { $set: req.body });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// HEARINGS ROUTES ─────────────────────────────────────────────────────────
app.post('/api/hearings', async (req, res) => {
    try {
        const hearing = await Hearing.create(req.body);
        res.json(hearing);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/hearings', async (req, res) => {
    try {
        const { caseId, userId } = req.query;
        let query = {};
        if (caseId) query.caseId = caseId;
        // userId filtering would need more complex lookup if done via MongoDB solely
        const hearings = await Hearing.find(query).sort({ hearingDate: -1 });
        res.json(hearings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// COURT ORDERS ROUTES ─────────────────────────────────────────────────────
app.post('/api/court-orders', async (req, res) => {
    try {
        const { caseId, orderText, verdict } = req.body;
        const { txHash, blockHeight } = genBlockchainData();
        const hash = '0x' + crypto.createHash('sha256').update(orderText).digest('hex');
        
        const order = await CourtOrder.create({ ...req.body, hash, txHash, blockHeight });
        await Case.findOneAndUpdate({ id: caseId }, { status: verdict === 'closed' ? 'closed' : 'judgement_issued' });
        res.json(order);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// LAWYERS ROUTES ──────────────────────────────────────────────────────────
app.get('/api/lawyers', async (req, res) => {
    try {
        const { specialization, city, minExp, maxFee, verified } = req.query;
        let query = {};
        if (specialization && specialization !== 'All') query.specialization = specialization;
        if (city) query.city = new RegExp(city, 'i');
        if (minExp) query.experience = { $gte: Number(minExp) };
        if (maxFee) query.fee = { $lte: Number(maxFee) };
        if (verified !== undefined) query.verified = verified === '1';

        const lawyers = await Lawyer.find(query).sort({ rating: -1, experience: -1 });
        res.json(lawyers);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/lawyers/:id', async (req, res) => {
    try {
        const lawyer = await Lawyer.findOne({ id: req.params.id });
        if (!lawyer) return res.status(404).json({ error: 'Lawyer not found' });
        res.json(lawyer);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/lawyers/:id/verify', async (req, res) => {
    try {
        await Lawyer.findOneAndUpdate({ id: req.params.id }, { verified: req.body.verified });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/lawyers/:id/rate', async (req, res) => {
    try {
        const { userId, rating, review } = req.body;
        await LawyerRating.findOneAndUpdate(
            { lawyerId: req.params.id, userId },
            { rating, review },
            { upsert: true }
        );
        // Recalculate avg
        const stats = await LawyerRating.aggregate([
            { $match: { lawyerId: req.params.id } },
            { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);
        if (stats.length > 0) {
            await Lawyer.findOneAndUpdate({ id: req.params.id }, { rating: stats[0].avg.toFixed(1), ratingCount: stats[0].count });
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cases/:id/hire-lawyer', async (req, res) => {
    try {
        const { lawyerId, lawyerName } = req.body;
        await Case.findOneAndUpdate({ id: req.params.id }, { assignedLawyer: lawyerId, assignedLawyerName: lawyerName, status: 'lawyer_assigned' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ACCESS REQUESTS ROUTES ─────────────────────────────────────────────────
app.post('/api/access-requests', async (req, res) => {
    try {
        const { evidenceId, adminId, targetUserId } = req.body;
        const existing = await AccessRequest.findOne({ evidenceId, adminId, targetUserId, status: 'pending' });
        if (existing) return res.status(409).json({ error: 'Request already pending' });
        const request = await AccessRequest.create(req.body);
        res.json(request);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/access-requests', async (req, res) => {
    try {
        const { adminId, userId } = req.query;
        let query = {};
        if (adminId) query.adminId = adminId;
        else if (userId) query.targetUserId = userId;
        const requests = await AccessRequest.find(query).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/access-requests/:id', async (req, res) => {
    try {
        await AccessRequest.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// USERS ROUTES ─────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
    try {
        const { search } = req.query;
        let query = search ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }], role: 'user' } : {};
        const users = await User.find(query).select('id name email role city address');
        res.json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

module.exports = app;
