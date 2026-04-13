import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const STATUS_COLOR = { filed: "#3b82f6", lawyer_assigned: "#d4a017", under_review: "#7c3aed", hearing_scheduled: "#06b6d4", judgement_issued: "#f59e0b", closed: "#22c55e" };
const TYPE_COLOR = { FIR: "#ef4444", CCTV: "#3b82f6", Forensic: "#22c55e", Document: "#f59e0b" };

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#1e3a6e;border-radius:2px}
.glass{background:rgba(15,23,42,.7);backdrop-filter:blur(20px);border:1px solid rgba(59,130,246,.12);border-radius:16px;}
.card{background:rgba(15,23,42,.7);border:1px solid rgba(59,130,246,.12);border-radius:12px;padding:18px;}
.btn-blue{cursor:pointer;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border:none;border-radius:8px;padding:10px 22px;color:#fff;font-family:inherit;font-size:13px;font-weight:700;transition:opacity .2s;}
.btn-blue:hover{opacity:.85;}
.btn-blue:disabled{opacity:.4;cursor:not-allowed;}
.btn-ghost{cursor:pointer;background:transparent;border:1px solid #1e3a6e;border-radius:8px;padding:8px 18px;color:#94a3b8;font-family:inherit;font-size:13px;transition:all .2s;}
.btn-ghost:hover{border-color:#3b82f6;color:#e2e8f0;}
.btn-gold{cursor:pointer;background:linear-gradient(135deg,#d4a017,#b8860b);border:none;border-radius:8px;padding:8px 16px;color:#020818;font-family:inherit;font-size:12px;font-weight:700;transition:all .2s;}
.btn-gold:hover{opacity:.85;}
.inp{width:100%;padding:10px 13px;background:rgba(5,7,13,.8);border:1px solid #1e3a6e;border-radius:8px;color:#e2e8f0;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s;}
.inp:focus{border-color:#3b82f6;}
.inp::placeholder{color:#475569;}
.inp option{background:#0a1628;}
.tab-btn{cursor:pointer;padding:8px 15px;border-bottom:2px solid transparent;color:#64748b;font-size:13px;font-weight:600;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit;transition:all .15s;white-space:nowrap;}
.tab-btn.on{border-bottom-color:#3b82f6;color:#e2e8f0;}
.tab-scroll{overflow-x:auto;white-space:nowrap;}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:22px;}
.lbl{font-size:10px;color:#64748b;letter-spacing:.1em;font-weight:600;margin-bottom:5px;}
.lawyer-card{background:rgba(15,23,42,.75);border:1px solid rgba(212,160,23,.15);border-radius:12px;padding:18px;transition:border-color .2s,transform .2s;}
.lawyer-card:hover{border-color:rgba(212,160,23,.45);transform:translateY(-2px);}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fadein{animation:fadein .3s ease;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.spinner{width:22px;height:22px;border:2px solid #1e3a6e;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;}
@media(max-width:640px){.pad{padding:14px!important;}.nav-row{flex-wrap:wrap;gap:8px!important;}.stat-grid{grid-template-columns:1fr 1fr!important;}}
@media(max-width:400px){.stat-grid{grid-template-columns:1fr!important;}}
.dash-theme-btn{position:fixed;bottom:20px;right:20px;z-index:999;width:42px;height:42px;border-radius:50%;border:1px solid rgba(212,160,23,.35);background:rgba(15,23,42,.95);color:#d4a017;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.4);transition:all .25s;}
.dash-theme-btn:hover{transform:scale(1.15) rotate(15deg);border-color:#d4a017;}
`;

function StatusBadge({ status }) {
    const col = STATUS_COLOR[status] || "#64748b";
    return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: col + "22", color: col }}>{status?.replace(/_/g, " ").toUpperCase()}</span>;
}
function Stars({ n }) {
    return <span style={{ color: "#f59e0b", fontSize: 13 }}>{"★".repeat(Math.round(n))}{"☆".repeat(5 - Math.round(n))}</span>;
}
function formatDate(iso) { return iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"; }

const CASE_CATS = ["Theft/Robbery", "Assault", "Cybercrime", "Property Dispute", "Family Matter", "Cheating/Fraud", "Murder/Attempt", "Drug Offense", "Other"];
const EV_TYPES = ["FIR", "CCTV", "Forensic", "Document"];

export default function UserDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [tab, setTab] = useState("track");

    // Case filing
    const [caseForm, setCaseForm] = useState({ title: "", category: "", description: "", location: "", incidentDate: "", opponentName: "", opponentContact: "" });
    const [filingDone, setFilingDone] = useState(null);
    const [filing, setFiling] = useState(false);

    // My cases
    const [myCases, setMyCases] = useState([]);
    const [casesLoading, setCasesLoading] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);

    // Hearings
    const [myHearings, setMyHearings] = useState([]);

    // Evidence upload
    const [uploadForm, setUploadForm] = useState({ name: "", type: "FIR", caseNo: "", caseId: "" });
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadDone, setUploadDone] = useState(null);

    // Lawyer marketplace
    const [lawyers, setLawyers] = useState([]);
    const [lawyersLoading, setLawyersLoading] = useState(false);
    const [filterSpec, setFilterSpec] = useState("All");
    const [filterMaxFee, setFilterMaxFee] = useState("");
    const [filterMinExp, setFilterMinExp] = useState("");
    const [hiringLawyer, setHiringLawyer] = useState(null);
    const [hireCase, setHireCase] = useState("");
    const [hireDone, setHireDone] = useState("");

    // Evidence for verify
    const [allEvidence, setAllEvidence] = useState([]);
    const [evLoading, setEvLoading] = useState(false);

    // Access requests
    const [myRequests, setMyRequests] = useState([]);
    const [reqLoading, setReqLoading] = useState(false);
    const [respondingId, setRespondingId] = useState(null);
    const pendingCount = myRequests.filter(r => r.status === "pending").length;

    const fetchMyCases = useCallback(async () => {
        if (!user?.id) return;
        setCasesLoading(true);
        try {
            const r = await fetch(`${API}/api/cases?role=user&userId=${encodeURIComponent(user.id)}`);
            const data = await r.json();
            setMyCases(data);
        } catch { setMyCases([]); }
        finally { setCasesLoading(false); }
    }, [user?.id]);

    const fetchHearings = useCallback(async () => {
        if (!user?.id) return;
        try {
            const r = await fetch(`${API}/api/hearings?userId=${encodeURIComponent(user.id)}`);
            setMyHearings(await r.json());
        } catch { setMyHearings([]); }
    }, [user?.id]);

    const fetchLawyers = useCallback(async () => {
        setLawyersLoading(true);
        try {
            const params = new URLSearchParams({ verified: "1" });
            if (filterSpec !== "All") params.append("specialization", filterSpec);
            if (filterMaxFee) params.append("maxFee", filterMaxFee);
            if (filterMinExp) params.append("minExp", filterMinExp);
            const r = await fetch(`${API}/api/lawyers?${params}`);
            setLawyers(await r.json());
        } catch { setLawyers([]); }
        finally { setLawyersLoading(false); }
    }, [filterSpec, filterMaxFee, filterMinExp]);

    const fetchMyRequests = useCallback(async () => {
        if (!user?.id) return;
        setReqLoading(true);
        try { const r = await fetch(`${API}/api/access-requests?userId=${encodeURIComponent(user.id)}`); setMyRequests(await r.json()); }
        catch { setMyRequests([]); }
        finally { setReqLoading(false); }
    }, [user?.id]);

    const fetchEvidence = useCallback(async () => {
        setEvLoading(true);
        try { const r = await fetch(`${API}/api/evidence`); setAllEvidence(await r.json()); }
        catch { setAllEvidence([]); }
        finally { setEvLoading(false); }
    }, []);

    useEffect(() => {
        fetchMyCases();
        fetchHearings();
        fetchMyRequests();
        fetchEvidence();
    }, [fetchMyCases, fetchHearings, fetchMyRequests, fetchEvidence]);

    useEffect(() => { if (tab === "marketplace") fetchLawyers(); }, [tab, fetchLawyers]);

    async function fileCase() {
        if (!caseForm.title || !caseForm.description || !caseForm.category) return;
        setFiling(true);
        try {
            const r = await fetch(`${API}/api/cases`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...caseForm, filedBy: user?.id, filedByName: user?.name || user?.email })
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            setFilingDone(d);
            setCaseForm({ title: "", category: "", description: "", location: "", incidentDate: "", opponentName: "", opponentContact: "" });
            fetchMyCases();
        } catch (e) { alert(e.message || "Failed to file case"); }
        finally { setFiling(false); }
    }

    async function loadCaseDetail(c) {
        try { const r = await fetch(`${API}/api/cases/${c.id}`); setSelectedCase(await r.json()); }
        catch { setSelectedCase(c); }
    }

    async function doUpload() {
        if (!uploadForm.name || !uploadForm.caseNo) { alert("Fill all required fields"); return; }
        setUploading(true);
        const fd = new FormData();
        Object.entries(uploadForm).forEach(([k, v]) => fd.append(k, v));
        fd.append("officer", user?.name || user?.email || "User");
        fd.append("station", user?.city || "City");
        if (uploadFile) fd.append("file", uploadFile);
        try {
            const r = await fetch(`${API}/api/evidence`, { method: "POST", body: fd });
            const d = await r.json();
            setUploadDone(d);
            setUploadForm({ name: "", type: "FIR", caseNo: "", caseId: "" });
            setUploadFile(null);
            fetchEvidence();
        } catch { alert("Upload failed"); }
        finally { setUploading(false); }
    }

    async function hireLawyer() {
        if (!hiringLawyer || !hireCase) { alert("Select a case first"); return; }
        await fetch(`${API}/api/cases/${hireCase}/hire-lawyer`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lawyerId: hiringLawyer.id, lawyerName: hiringLawyer.name })
        });
        setHireDone(`${hiringLawyer.name} hired successfully for case ${hireCase}! They will see your case in their portal.`);
        setHiringLawyer(null); setHireCase("");
        fetchMyCases();
        setTimeout(() => setHireDone(""), 5000);
    }

    async function respondToRequest(reqId, status) {
        setRespondingId(reqId);
        try {
            await fetch(`${API}/api/access-requests/${reqId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
            setMyRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));
        } catch { alert("Failed"); }
        finally { setRespondingId(null); }
    }

    const displayName = user?.name || user?.email?.split("@")[0] || "User";

    return (
        <div style={{ minHeight: "100vh", background: isDark ? "#05070d" : "#f0ede6", fontFamily: "'Inter',sans-serif", color: isDark ? "#e2e8f0" : "#1a1a2e" }}>
            <style>{STYLES}</style>
            <button className="dash-theme-btn" onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"}>{isDark ? "☀️" : "🌙"}</button>

            {/* Navbar */}
            <div style={{ background: "rgba(15,23,42,.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(59,130,246,.1)", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
                <div className="nav-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => navigate("/")}>
                        <img src="/logo.jpg" alt="LexChain" style={{ height: 32, borderRadius: 7 }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>LEXCHAIN</div>
                            <div style={{ fontSize: 9, color: "#475569", letterSpacing: ".1em" }}>CITIZEN PORTAL</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ background: "rgba(29,78,216,.15)", border: "1px solid rgba(59,130,246,.2)", borderRadius: 8, padding: "4px 10px", color: "#93c5fd", fontSize: 11, fontWeight: 700 }}>👤 {displayName}</div>
                        {user?.city && <div style={{ color: "#475569", fontSize: 11 }}>📍 {user.city}</div>}
                        <button className="btn-ghost" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => { logout(); navigate("/"); }}>Sign Out</button>
                    </div>
                </div>
                <div className="tab-scroll" style={{ display: "flex", gap: 2, borderTop: "1px solid rgba(59,130,246,.06)", justifyContent: "center" }}>
                    {[
                        ["track", "🔍 Track Cases"],
                        ["file-case", "📋 File Case"],
                        ["hearings", "📅 Hearings"],
                        ["marketplace", "⚖️ Lawyers"],
                        ["upload", "⬆ Upload Evidence"],
                        ["evidence", "🗂 Evidence"],
                        ["requests", "🔔 Requests" + (pendingCount > 0 ? ` (${pendingCount})` : "")]
                    ].map(([k, v]) => (
                        <button key={k} className={`tab-btn ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); setSelectedCase(null); setFilingDone(null); setUploadDone(null); setHiringLawyer(null); }}>{v}</button>
                    ))}
                </div>
            </div>

            <div className="pad" style={{ padding: "24px 24px", maxWidth: 1050, margin: "0 auto" }}>

                {/* ── TRACK CASES ── */}
                {tab === "track" && (
                    <div className="fadein">
                        <div className="stat-grid">
                            {[["My Cases", myCases.length, "#3b82f6", "📋"], ["Active", myCases.filter(c => c.status !== "closed").length, "#d4a017", "⚖️"], ["Closed", myCases.filter(c => c.status === "closed").length, "#22c55e", "✅"], ["Hearings", myHearings.length, "#06b6d4", "📅"]].map(([l, v, c, i]) => (
                                <div key={l} className="card">
                                    <div style={{ fontSize: 18, marginBottom: 5 }}>{i}</div>
                                    <div style={{ fontSize: 26, fontWeight: 800, color: c, fontFamily: "monospace" }}>{v}</div>
                                    <div style={{ fontSize: 10, color: "#475569", marginTop: 3, letterSpacing: ".08em" }}>{l.toUpperCase()}</div>
                                </div>
                            ))}
                        </div>

                        {!selectedCase ? (
                            <div>
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>MY CASES</div>
                                {casesLoading ? <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><div className="spinner" style={{ margin: "0 auto 12px" }} />Loading...</div>
                                    : myCases.length === 0 ? (
                                        <div className="glass" style={{ padding: 48, textAlign: "center" }}>
                                            <div style={{ fontSize: 48, marginBottom: 14 }}>📋</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>No cases filed yet</div>
                                            <div style={{ fontSize: 13, color: "#475569", marginBottom: 18 }}>Use "File Case" to submit your first case.</div>
                                            <button className="btn-blue" onClick={() => setTab("file-case")}>📋 File Your First Case →</button>
                                        </div>
                                    ) : myCases.map(c => (
                                        <div key={c.id} className="card fadein" style={{ marginBottom: 12, cursor: "pointer", transition: "border-color .2s" }}
                                            onClick={async () => { await loadCaseDetail(c); }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(59,130,246,.35)"}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(59,130,246,.12)"}>
                                            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", marginBottom: 4 }}>{c.title}</div>
                                                    <div style={{ fontSize: 12, color: "#475569" }}>
                                                        <span style={{ color: "#60a5fa", fontFamily: "monospace", marginRight: 12 }}>{c.id}</span>
                                                        <span>{c.category}</span> · <span>Filed {new Date(c.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                                                        {c.assignedLawyerName ? `⚖️ ${c.assignedLawyerName}` : "⚖️ No lawyer assigned"}
                                                    </div>
                                                </div>
                                                <StatusBadge status={c.status} />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            // Case Detail
                            <div className="fadein">
                                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
                                    <button className="btn-ghost" onClick={() => setSelectedCase(null)}>← My Cases</button>
                                    <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>CASE DETAIL · {selectedCase.id}</span>
                                    <div style={{ marginLeft: "auto" }}><StatusBadge status={selectedCase.status} /></div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 16 }}>
                                    <div className="card">
                                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 12 }}>CASE INFO</div>
                                        {[["Case ID", selectedCase.id], ["Title", selectedCase.title], ["Category", selectedCase.category], ["Location", selectedCase.location || "—"], ["Incident Date", selectedCase.incidentDate || "—"], ["Opponent", selectedCase.opponentName || "—"], ["Lawyer", selectedCase.assignedLawyerName || "Not assigned"], ["Judge", selectedCase.assignedJudgeName || "Not assigned"]].map(([k, v]) => (
                                            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(59,130,246,.07)", fontSize: 13, gap: 8 }}>
                                                <span style={{ color: "#64748b", flexShrink: 0 }}>{k}</span><span style={{ color: "#94a3b8", textAlign: "right" }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="card">
                                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 10 }}>DESCRIPTION</div>
                                        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{selectedCase.description}</p>
                                    </div>
                                </div>

                                {/* Case Status Timeline */}
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>CASE TIMELINE</div>
                                    {["filed", "lawyer_assigned", "hearing_scheduled", "judgement_issued", "closed"].map((s, i) => {
                                        const statuses = ["filed", "lawyer_assigned", "hearing_scheduled", "judgement_issued", "closed"];
                                        const currentIdx = statuses.indexOf(selectedCase.status);
                                        const reached = i <= currentIdx;
                                        return (
                                            <div key={s} style={{ display: "flex", alignItems: "flex-start", marginBottom: 12, position: "relative" }}>
                                                <div style={{ width: 24, height: 24, borderRadius: "50%", background: reached ? STATUS_COLOR[s] || "#3b82f6" : "rgba(30,58,110,.5)", border: `2px solid ${reached ? STATUS_COLOR[s] || "#3b82f6" : "#1e3a6e"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 12, transition: "all .3s" }}>
                                                    {reached && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: reached ? STATUS_COLOR[s] || "#3b82f6" : "#475569" }}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</div>
                                                    {s === selectedCase.status && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>← Current status</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Hearings */}
                                {(selectedCase.hearings || []).length > 0 && (
                                    <div className="card" style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>📅 SCHEDULED HEARINGS</div>
                                        {selectedCase.hearings.map((h, i) => (
                                            <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(59,130,246,.07)", fontSize: 13, flexWrap: "wrap", gap: 8 }}>
                                                <div>
                                                    <div style={{ color: "#e2e8f0", fontWeight: 700 }}>Hearing {i + 1}: {h.hearingDate} at {h.hearingTime}</div>
                                                    <div style={{ color: "#475569", fontSize: 12, marginTop: 3 }}>📍 {h.venue}{h.notes && ` · ${h.notes}`}</div>
                                                </div>
                                                <span style={{ padding: "3px 10px", background: "rgba(6,182,212,.12)", border: "1px solid rgba(6,182,212,.25)", borderRadius: 20, fontSize: 11, color: "#06b6d4" }}>📅 Scheduled</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Court Orders */}
                                {(selectedCase.courtOrders || []).length > 0 && (
                                    <div className="card">
                                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>📜 COURT ORDERS</div>
                                        {selectedCase.courtOrders.map(o => (
                                            <div key={o.id} style={{ padding: 14, background: "rgba(5,7,13,.6)", borderRadius: 10, marginBottom: 10 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                                                    <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>🏛️ {o.judgeName}</span>
                                                    <span style={{ color: o.verdict === "acquitted" ? "#22c55e" : o.verdict === "convicted" ? "#ef4444" : "#f59e0b", fontSize: 11, fontWeight: 700 }}>{o.verdict?.toUpperCase()}</span>
                                                </div>
                                                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{o.orderText}</p>
                                                <div style={{ fontSize: 10, color: "#334155", marginTop: 8, fontFamily: "monospace" }}>Hash: {o.hash}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── FILE CASE ── */}
                {tab === "file-case" && (
                    <div className="fadein" style={{ maxWidth: 640 }}>
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 20 }}>FILE A NEW CASE</div>
                        {filingDone ? (
                            <div className="glass fadein" style={{ padding: 36, textAlign: "center" }}>
                                <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e", marginBottom: 8 }}>Case Filed Successfully!</div>
                                <div style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>Your case has been registered on LexChain blockchain.</div>
                                {[["Case ID", filingDone.id], ["Title", filingDone.title], ["Category", filingDone.category], ["Status", "FILED"]].map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(59,130,246,.08)", fontSize: 13, gap: 8 }}>
                                        <span style={{ color: "#475569" }}>{k}</span><span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{v}</span>
                                    </div>
                                ))}
                                <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center", flexWrap: "wrap" }}>
                                    <button className="btn-blue" onClick={() => { setFilingDone(null); setTab("track"); }}>📋 Track My Cases →</button>
                                    <button className="btn-ghost" onClick={() => { setFilingDone(null); }}>File Another Case</button>
                                </div>
                            </div>
                        ) : (
                            <div className="glass" style={{ padding: 26 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    <div>
                                        <div className="lbl">CASE TITLE <span style={{ color: "#ef4444" }}>*</span></div>
                                        <input className="inp" placeholder="Short, descriptive title of your case" value={caseForm.title} onChange={e => setCaseForm(p => ({ ...p, title: e.target.value }))} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div>
                                            <div className="lbl">CATEGORY <span style={{ color: "#ef4444" }}>*</span></div>
                                            <select className="inp" value={caseForm.category} onChange={e => setCaseForm(p => ({ ...p, category: e.target.value }))}>
                                                <option value="">— Select —</option>
                                                {CASE_CATS.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <div className="lbl">DATE OF INCIDENT</div>
                                            <input className="inp" type="date" value={caseForm.incidentDate} onChange={e => setCaseForm(p => ({ ...p, incidentDate: e.target.value }))} max={new Date().toISOString().split("T")[0]} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="lbl">DESCRIPTION <span style={{ color: "#ef4444" }}>*</span></div>
                                        <textarea className="inp" rows={5} placeholder="Detailed description of the incident, what happened, how it happened..." value={caseForm.description} onChange={e => setCaseForm(p => ({ ...p, description: e.target.value }))} style={{ resize: "vertical", lineHeight: 1.7 }} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div>
                                            <div className="lbl">LOCATION / ADDRESS</div>
                                            <input className="inp" placeholder="Where the incident occurred" value={caseForm.location} onChange={e => setCaseForm(p => ({ ...p, location: e.target.value }))} />
                                        </div>
                                        <div>
                                            <div className="lbl">OPPONENT NAME</div>
                                            <input className="inp" placeholder="Name of accused/opponent (if known)" value={caseForm.opponentName} onChange={e => setCaseForm(p => ({ ...p, opponentName: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="lbl">OPPONENT CONTACT / DETAILS</div>
                                        <input className="inp" placeholder="Phone, address, or other contact details of opponent" value={caseForm.opponentContact} onChange={e => setCaseForm(p => ({ ...p, opponentContact: e.target.value }))} />
                                    </div>
                                    <button className="btn-blue" style={{ padding: "13px", fontSize: 14, width: "100%" }} onClick={fileCase} disabled={filing || !caseForm.title || !caseForm.description || !caseForm.category}>
                                        {filing ? "Submitting to blockchain..." : "📋 Submit Case to LexChain →"}
                                    </button>
                                    <div style={{ fontSize: 11, color: "#334155", padding: "9px 12px", background: "rgba(5,7,13,.5)", borderRadius: 8, lineHeight: 1.7 }}>
                                        ℹ️ A unique Case ID (e.g. <span style={{ fontFamily: "monospace", color: "#60a5fa" }}>LCX-2026-0001</span>) is auto-generated and stored on the blockchain.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── HEARINGS ── */}
                {tab === "hearings" && (
                    <div className="fadein">
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 18 }}>MY SCHEDULED HEARINGS</div>
                        {myHearings.length === 0 ? (
                            <div className="glass" style={{ padding: 48, textAlign: "center" }}>
                                <div style={{ fontSize: 48, marginBottom: 14 }}>📅</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>No hearings scheduled yet</div>
                                <div style={{ fontSize: 13, color: "#475569" }}>When a Judge schedules a hearing for your case, it will appear here.</div>
                            </div>
                        ) : (
                            <div>
                                {myHearings.map(h => {
                                    const isUpcoming = new Date(h.hearingDate) >= new Date();
                                    return (
                                        <div key={h.id} className="card fadein" style={{ marginBottom: 14, borderColor: isUpcoming ? "rgba(6,182,212,.3)" : "rgba(59,130,246,.12)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                                        <span style={{ fontSize: 20 }}>📅</span>
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: 15, color: "#e2e8f0" }}>{h.hearingDate}</div>
                                                            <div style={{ fontSize: 12, color: "#475569" }}>{h.hearingTime}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>📍 {h.venue}</div>
                                                    <div style={{ fontSize: 12, color: "#60a5fa", fontFamily: "monospace" }}>Case: {h.caseId}</div>
                                                    {h.caseTitle && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{h.caseTitle}</div>}
                                                    {h.notes && <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>📝 {h.notes}</div>}
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: isUpcoming ? "rgba(6,182,212,.12)" : "rgba(100,116,139,.12)", color: isUpcoming ? "#06b6d4" : "#64748b" }}>
                                                        {isUpcoming ? "⏰ UPCOMING" : "✓ PAST"}
                                                    </span>
                                                    {h.scheduledByName && <div style={{ fontSize: 11, color: "#475569" }}>🏛️ {h.scheduledByName}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── LAWYER MARKETPLACE ── */}
                {tab === "marketplace" && (
                    <div className="fadein">
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 18 }}>⚖️ LAWYER MARKETPLACE</div>
                        {hireDone && <div style={{ padding: "10px 14px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 8, fontSize: 13, color: "#86efac", marginBottom: 16 }}>✅ {hireDone}</div>}

                        {/* Filters */}
                        <div className="card" style={{ marginBottom: 18 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
                                <div>
                                    <div className="lbl">SPECIALIZATION</div>
                                    <select className="inp" value={filterSpec} onChange={e => setFilterSpec(e.target.value)}>
                                        {["All", "Criminal Law", "Civil Law", "Family Law", "Constitutional Law", "Cyber Law", "Corporate Law", "Property Law", "Human Rights", "Tax Law", "Labor Law"].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div className="lbl">MIN EXPERIENCE (YRS)</div>
                                    <input className="inp" type="number" min="0" placeholder="e.g. 5" value={filterMinExp} onChange={e => setFilterMinExp(e.target.value)} />
                                </div>
                                <div>
                                    <div className="lbl">MAX FEE (₹)</div>
                                    <input className="inp" type="number" min="0" placeholder="e.g. 10000" value={filterMaxFee} onChange={e => setFilterMaxFee(e.target.value)} />
                                </div>
                                <div style={{ display: "flex", alignItems: "flex-end" }}>
                                    <button className="btn-blue" style={{ width: "100%", padding: "10px" }} onClick={fetchLawyers}>🔍 Search</button>
                                </div>
                            </div>
                        </div>

                        {/* Hire Modal */}
                        {hiringLawyer && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
                                <div className="glass" style={{ maxWidth: 440, width: "100%", padding: 28 }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Hire {hiringLawyer.name}</div>
                                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>Select which case you want to assign this lawyer to.</div>
                                    <div>
                                        <div className="lbl">SELECT CASE</div>
                                        <select className="inp" value={hireCase} onChange={e => setHireCase(e.target.value)}>
                                            <option value="">— Choose case —</option>
                                            {myCases.filter(c => !c.assignedLawyer && c.status !== "closed").map(c => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}
                                        </select>
                                    </div>
                                    {myCases.filter(c => !c.assignedLawyer && c.status !== "closed").length === 0 && (
                                        <div style={{ fontSize: 13, color: "#f59e0b", marginTop: 10 }}>No open cases without a lawyer. File a case first.</div>
                                    )}
                                    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                                        <button className="btn-blue" style={{ flex: 1 }} onClick={hireLawyer} disabled={!hireCase}>✓ Confirm Hire</button>
                                        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setHiringLawyer(null); setHireCase(""); }}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {lawyersLoading ? <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><div className="spinner" style={{ margin: "0 auto 12px" }} />Loading lawyers...</div>
                            : lawyers.length === 0 ? <div className="glass" style={{ padding: 40, textAlign: "center", color: "#475569" }}>No lawyers found for that filter.</div>
                                : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
                                        {lawyers.map(l => (
                                            <div key={l.id} className="lawyer-card">
                                                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                                                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#d4a017,#b8860b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚖️</div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", marginBottom: 2 }}>{l.name}</div>
                                                        <div style={{ fontSize: 12, color: "#d4a017", fontWeight: 600 }}>{l.specialization}</div>
                                                        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{l.courtName}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                                                    {[["Experience", `${l.experience} yrs`], ["Fee", `₹${l.fee?.toLocaleString()}`], ["City", l.city], ["Rating", `${parseFloat(l.rating || 0).toFixed(1)} (${l.ratingCount})`]].map(([k, v]) => (
                                                        <div key={k} style={{ padding: "6px 10px", background: "rgba(5,7,13,.6)", borderRadius: 7 }}>
                                                            <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>{k}</div>
                                                            <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{v}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ marginBottom: 12 }}><Stars n={l.rating} /></div>
                                                {l.bio && <p style={{ fontSize: 12, color: "#475569", marginBottom: 14, lineHeight: 1.6 }}>{l.bio}</p>}
                                                <button className="btn-gold" style={{ width: "100%", padding: 10 }} onClick={() => setHiringLawyer(l)}>⚖️ Hire This Lawyer →</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                    </div>
                )}

                {/* ── UPLOAD EVIDENCE ── */}
                {tab === "upload" && (
                    <div className="fadein" style={{ maxWidth: 560 }}>
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 20 }}>UPLOAD EVIDENCE TO BLOCKCHAIN</div>
                        {!uploadDone ? (
                            <div className="glass" style={{ padding: 26 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    <div>
                                        <div className="lbl">EVIDENCE NAME <span style={{ color: "#ef4444" }}>*</span></div>
                                        <input className="inp" placeholder="e.g. FIR_2024_Case.pdf" value={uploadForm.name} onChange={e => setUploadForm(p => ({ ...p, name: e.target.value }))} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div>
                                            <div className="lbl">CASE NUMBER <span style={{ color: "#ef4444" }}>*</span></div>
                                            <input className="inp" placeholder="e.g. CR-2024-001" value={uploadForm.caseNo} onChange={e => setUploadForm(p => ({ ...p, caseNo: e.target.value }))} />
                                        </div>
                                        <div>
                                            <div className="lbl">EVIDENCE TYPE</div>
                                            <select className="inp" value={uploadForm.type} onChange={e => setUploadForm(p => ({ ...p, type: e.target.value }))}>
                                                {EV_TYPES.map(t => <option key={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="lbl">LINK TO CASE (OPTIONAL)</div>
                                        <select className="inp" value={uploadForm.caseId} onChange={e => setUploadForm(p => ({ ...p, caseId: e.target.value }))}>
                                            <option value="">— Link to one of my cases —</option>
                                            {myCases.map(c => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ border: "2px dashed #1e3a6e", borderRadius: 10, padding: 22, textAlign: "center", cursor: "pointer", position: "relative" }}>
                                        <input type="file" onChange={e => setUploadFile(e.target.files[0])} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                                        <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                                        <div style={{ color: uploadFile ? "#60a5fa" : "#475569", fontWeight: uploadFile ? 600 : 400, fontSize: 13 }}>{uploadFile ? uploadFile.name : "Click to select or drag a file"}</div>
                                        <div style={{ fontSize: 11, marginTop: 4, color: "#334155" }}>SHA-256 hash computed before upload — immutable proof</div>
                                    </div>
                                    <button className="btn-blue" style={{ padding: "13px", fontSize: 14, width: "100%" }} onClick={doUpload} disabled={uploading}>
                                        {uploading ? "Anchoring to blockchain..." : "⬆ Upload & Anchor to Blockchain"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="glass fadein" style={{ padding: 36, textAlign: "center" }}>
                                <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e", marginBottom: 10 }}>Evidence Anchored!</div>
                                {[["Evidence ID", uploadDone.id], ["TX Hash", uploadDone.txHash?.slice(0, 26) + "..."], ["IPFS CID", uploadDone.ipfsCid?.slice(0, 20) + "..."], ["Block", `#${uploadDone.blockHeight?.toLocaleString()}`]].map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(59,130,246,.08)", fontSize: 12, gap: 8 }}>
                                        <span style={{ color: "#475569" }}>{k}</span><span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{v}</span>
                                    </div>
                                ))}
                                <button className="btn-ghost" style={{ marginTop: 18 }} onClick={() => setUploadDone(null)}>Upload Another</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── EVIDENCE LIST ── */}
                {tab === "evidence" && (
                    <div className="fadein">
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>EVIDENCE REGISTRY · {allEvidence.length} RECORDS</div>
                        {evLoading ? <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><div className="spinner" style={{ margin: "0 auto 12px" }} />Loading...</div>
                            : allEvidence.length === 0 ? <div className="glass" style={{ padding: 40, textAlign: "center", color: "#475569" }}>No evidence uploaded yet.</div>
                                : allEvidence.map(ev => (
                                    <div key={ev.id} className="card fadein" style={{ marginBottom: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", marginBottom: 3 }}>📄 {ev.name}</div>
                                                <div style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
                                                    <span style={{ color: "#60a5fa" }}>{ev.id}</span> · {ev.caseNo} · {new Date(ev.timestamp).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span style={{ fontSize: 11, padding: "2px 10px", background: (TYPE_COLOR[ev.type] || "#64748b") + "22", color: TYPE_COLOR[ev.type] || "#64748b", borderRadius: 20, fontWeight: 700 }}>{ev.type}</span>
                                                <span style={{ fontSize: 11, color: ev.courtApproval === "approved" ? "#22c55e" : ev.courtApproval === "rejected" ? "#ef4444" : "#f59e0b", fontWeight: 700 }}>
                                                    {ev.courtApproval === "approved" ? "✅ Approved" : ev.courtApproval === "rejected" ? "❌ Rejected" : "⏳ Pending Court"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                    </div>
                )}

                {/* ── REQUESTS ── */}
                {tab === "requests" && (
                    <div className="fadein" style={{ maxWidth: 680 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 6 }}>ACCESS REQUESTS FROM ADMINS</div>
                                <div style={{ fontSize: 13, color: "#64748b" }}>Admins must request your permission to view your evidence.</div>
                            </div>
                            <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={fetchMyRequests}>↻ Refresh</button>
                        </div>
                        {pendingCount > 0 && <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fbbf24" }}>🔔 You have <strong>{pendingCount}</strong> pending request{pendingCount > 1 ? "s" : ""} awaiting your response.</div>}
                        {reqLoading ? <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><div className="spinner" style={{ margin: "0 auto 12px" }} />Loading...</div>
                            : myRequests.length === 0 ? (
                                <div className="glass" style={{ padding: 48, textAlign: "center" }}>
                                    <div style={{ fontSize: 48, marginBottom: 14 }}>🔔</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>No requests</div>
                                    <div style={{ fontSize: 13, color: "#475569" }}>Access requests from admins will appear here.</div>
                                </div>
                            ) : myRequests.map(req => (
                                <div key={req.id} style={{ background: "rgba(15,23,42,.6)", border: `1px solid ${req.status === "pending" ? "rgba(245,158,11,.3)" : req.status === "accepted" ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.15)"}`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>📄 {req.evidenceName || req.evidenceId}</div>
                                            <div style={{ fontSize: 12, color: "#475569" }}>Requested by: <span style={{ color: "#93c5fd", fontWeight: 600 }}>{req.adminName}</span></div>
                                        </div>
                                        {req.status !== "pending" && (
                                            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: req.status === "accepted" ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.1)", color: req.status === "accepted" ? "#22c55e" : "#ef4444" }}>
                                                {req.status === "accepted" ? "✓ ACCEPTED" : "✗ DECLINED"}
                                            </span>
                                        )}
                                    </div>
                                    {req.status === "pending" && (
                                        <div style={{ display: "flex", gap: 10, paddingTop: 10, borderTop: "1px solid rgba(59,130,246,.08)" }}>
                                            <button style={{ flex: 1, cursor: "pointer", padding: "8px", background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, color: "#22c55e", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }} disabled={respondingId === req.id} onClick={() => respondToRequest(req.id, "accepted")}>✓ Accept</button>
                                            <button style={{ flex: 1, cursor: "pointer", padding: "8px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, color: "#ef4444", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }} disabled={respondingId === req.id} onClick={() => respondToRequest(req.id, "declined")}>✗ Decline</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
