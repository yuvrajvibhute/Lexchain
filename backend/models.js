const mongoose = require('mongoose');

// --- Evidence Schema ---
const EvidenceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  type: String,
  hash: { type: String },
  ipfsCid: String,
  ipfsUrl: String,
  uploadedBy: String,
  station: String,
  caseNo: String,
  caseId: String,
  timestamp: { type: Date, default: Date.now },
  blockHeight: Number,
  txHash: String,
  status: { type: String, default: 'verified' },
  courtApproval: { type: String, default: 'pending' },
  chainOfCustody: [{
    officer: String,
    action: String,
    time: { type: Date, default: Date.now }
  }]
});

// --- User Schema ---
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Wallet address or email hash
  name: String,
  email: String,
  address: String,
  role: { type: String, default: 'user' },
  loginMethod: String,
  city: String,
  post: String,
  phone: String,
  aadhaar: String,
  fullAddress: String
});

// --- Lawyer Schema ---
const LawyerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  name: String,
  email: String,
  barCouncilId: String,
  licenseNo: String,
  specialization: String,
  experience: { type: Number, default: 0 },
  fee: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  courtName: String,
  city: String,
  phone: String,
  bio: String,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// --- Case Schema ---
const CaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  category: String,
  description: String,
  location: String,
  incidentDate: String,
  opponentName: String,
  opponentContact: String,
  filedBy: String, 
  filedByName: String,
  assignedLawyer: String,
  assignedLawyerName: String,
  assignedJudge: String,
  assignedJudgeName: String,
  status: { type: String, default: 'filed' },
  createdAt: { type: Date, default: Date.now }
});

// --- Hearing Schema ---
const HearingSchema = new mongoose.Schema({
  caseId: String,
  caseTitle: String,
  hearingDate: String,
  hearingTime: String,
  venue: String,
  notes: String,
  scheduledBy: String,
  scheduledByName: String,
  createdAt: { type: Date, default: Date.now }
});

// --- Court Order Schema ---
const CourtOrderSchema = new mongoose.Schema({
  caseId: String,
  caseTitle: String,
  judgeId: String,
  judgeName: String,
  orderText: String,
  verdict: String,
  hash: String,
  txHash: String,
  blockHeight: Number,
  createdAt: { type: Date, default: Date.now }
});

// --- Access Request Schema ---
const AccessRequestSchema = new mongoose.Schema({
  id: { type: String },
  evidenceId: String,
  adminId: String,
  adminName: String,
  targetUserName: String,
  targetUserId: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
// Auto-set id = _id.toString() before save
AccessRequestSchema.pre('save', function(next) {
  if (!this.id) this.id = this._id.toString();
  next();
});
// Also handle findOneAndUpdate + create path
AccessRequestSchema.post('save', function(doc) {
  if (!doc.id) {
    doc.id = doc._id.toString();
    doc.save().catch(() => {});
  }
});

// --- Lawyer Rating Schema ---
const LawyerRatingSchema = new mongoose.Schema({
  lawyerId: String,
  userId: String,
  rating: Number,
  review: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Evidence: mongoose.model('Evidence', EvidenceSchema),
  User: mongoose.model('User', UserSchema),
  Lawyer: mongoose.model('Lawyer', LawyerSchema),
  Case: mongoose.model('Case', CaseSchema),
  Hearing: mongoose.model('Hearing', HearingSchema),
  CourtOrder: mongoose.model('CourtOrder', CourtOrderSchema),
  AccessRequest: mongoose.model('AccessRequest', AccessRequestSchema),
  LawyerRating: mongoose.model('LawyerRating', LawyerRatingSchema)
};
