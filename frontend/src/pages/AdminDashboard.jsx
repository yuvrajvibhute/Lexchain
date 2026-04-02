import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const typeColors = { FIR: "#ef4444", CCTV: "#3b82f6", Forensic: "#22c55e", Document: "#f59e0b" };
const statusColors = { verified: "#22c55e", pending: "#f59e0b", disputed: "#ef4444" };
function shortHash(h) { return h ? h.slice(0, 10) + "..." + h.slice(-6) : "—"; }
function formatDate(iso) {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ADMIN_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#1e3a6e;border-radius:2px}
.glass{background:rgba(15,23,42,.7);backdrop-filter:blur(20px);border:1px solid rgba(59,130,246,.12);border-radius:16px;}
.card{background:rgba(15,23,42,.7);border:1px solid rgba(59,130,246,.12);border-radius:12px;padding:22px;}
.btn-blue{cursor:pointer;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border:none;border-radius:8px;padding:10px 22px;color:#fff;font-family:inherit;font-size:13px;font-weight:700;transition:opacity .2s;white-space:nowrap;}
.btn-blue:hover{opacity:.85;}
.btn-blue:disabled{opacity:.4;cursor:not-allowed;}
.btn-ghost{cursor:pointer;background:transparent;border:1px solid #1e3a6e;border-radius:8px;padding:8px 18px;color:#94a3b8;font-family:inherit;font-size:13px;transition:all .2s;white-space:nowrap;}
.btn-ghost:hover{border-color:#3b82f6;color:#e2e8f0;}
.btn-gold{cursor:pointer;background:linear-gradient(135deg,#d4a017,#b8860b);border:none;border-radius:8px;padding:8px 18px;color:#020818;font-family:inherit;font-size:13px;font-weight:700;transition:all .2s;}
.btn-gold:hover{opacity:.85;transform:translateY(-1px);}
.btn-green{cursor:pointer;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:8px 18px;color:#22c55e;font-family:inherit;font-size:13px;font-weight:700;transition:all .2s;}
.btn-green:hover{background:rgba(34,197,94,.25);}
.inp{width:100%;padding:10px 14px;background:rgba(5,7,13,.8);border:1px solid #1e3a6e;border-radius:8px;color:#e2e8f0;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s;}
.inp:focus{border-color:#3b82f6;}
.inp::placeholder{color:#475569;}
.inp option{background:#0a1628;}
.tab-btn{cursor:pointer;padding:8px 16px;border-bottom:2px solid transparent;color:#64748b;font-size:13px;font-weight:600;transition:all .15s;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit;white-space:nowrap;}
.tab-btn.active{border-bottom-color:#3b82f6;color:#e2e8f0;}
.tab-btn:hover:not(.active){color:#94a3b8;}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fadein{animation:fadein .3s ease;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
select.inp{appearance:none;}
.user-result-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border-radius:8px;background:rgba(5,7,13,.5);border:1px solid rgba(59,130,246,.1);margin-bottom:8px;font-size:13px;}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
.ev-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.ev-header{display:grid;grid-template-columns:100px 1fr 130px 80px 100px 110px;gap:10px;padding:10px 16px;background:rgba(5,7,13,.5);font-size:10px;color:#334155;letter-spacing:.1em;min-width:640px;}
.ev-row{display:grid;grid-template-columns:100px 1fr 130px 80px 100px 110px;gap:10px;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(59,130,246,.06);cursor:pointer;transition:background .12s;font-size:13px;min-width:640px;}
.ev-row:hover{background:rgba(29,78,216,.06);}
.req-row{display:grid;grid-template-columns:1fr 120px 70px 100px;gap:12px;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(59,130,246,.06);font-size:13px;}
.form-grid{display:flex;flex-direction:column;gap:16px;}
.lbl{font-size:11px;color:#64748b;margin-bottom:6px;letter-spacing:.08em;font-weight:600;}
.spinner{width:20px;height:20px;border:2px solid #1e3a6e;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;}

/* Responsive */
@media(max-width:1024px){.stat-grid{grid-template-columns:repeat(2,1fr)!important;}}
@media(max-width:640px){
  .stat-grid{grid-template-columns:1fr 1fr!important;}
  .admin-header-actions{flex-wrap:wrap;gap:8px!important;}
  .admin-pad{padding:16px!important;}
  .tab-scroll{overflow-x:auto;white-space:nowrap;}
}
@media(max-width:480px){
  .stat-grid{grid-template-columns:1fr!important;}
}
`;

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState("dashboard");
    const [evidence, setEvidence] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [searchQ, setSearchQ] = useState("");
    const [verifyInput, setVerifyInput] = useState("");
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [uploadForm, setUploadForm] = useState({ name: "", type: "FIR", caseNo: "", officer: "", station: "" });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadDone, setUploadDone] = useState(false);
    const [uploadData, setUploadData] = useState(null);
    const [tick, setTick] = useState(0);

    const [grantedIds, setGrantedIds] = useState(new Set());
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState([]);
    const [requestingEv, setRequestingEv] = useState(null);
    const [requestStatus, setRequestStatus] = useState("");

    // New: Lawyers & Cases
    const [lawyers, setLawyers] = useState([]);
    const [lawyersLoading, setLawyersLoading] = useState(false);
    const [allCases, setAllCases] = useState([]);
    const [casesLoading, setCasesLoading] = useState(false);

    const fetchLawyers = useCallback(async () => {
        setLawyersLoading(true);
        try { const r = await fetch(`${API}/api/lawyers`); setLawyers(await r.json()); }
        catch { setLawyers([]); }
        finally { setLawyersLoading(false); }
    }, []);

    const fetchAllCases = useCallback(async () => {
        setCasesLoading(true);
        try { const r = await fetch(`${API}/api/cases`); setAllCases(await r.json()); }
        catch { setAllCases([]); }
        finally { setCasesLoading(false); }
    }, []);

    async function toggleLawyerVerify(lawyer) {
        await fetch(`${API}/api/lawyers/${lawyer.id}/verify`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified: !lawyer.verified })
        });
        fetchLawyers();
    }

    useEffect(() => {
        fetchEvidence(); fetchGrants(); fetchSentRequests();
        const iv = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(iv);
    }, []);

    async function fetchEvidence() {
        setLoading(true);
        try { const r = await fetch(`${API}/api/evidence`); setEvidence(await r.json()); }
        catch { setEvidence([]); }
        finally { setLoading(false); }
    }

    async function fetchGrants() {
        if (!user?.id) return;
        try { const r = await fetch(`${API}/api/access-grants?adminId=${encodeURIComponent(user.id)}`); setGrantedIds(new Set(await r.json())); }
        catch { setGrantedIds(new Set()); }
    }

    async function fetchSentRequests() {
        if (!user?.id) return;
        try { const r = await fetch(`${API}/api/access-requests?adminId=${encodeURIComponent(user.id)}`); setSentRequests(await r.json()); }
        catch { setSentRequests([]); }
    }

    async function searchUsers(q) {
        if (q.length < 2) { setUserResults([]); return; }
        setUserSearchLoading(true);
        try { const r = await fetch(`${API}/api/users?search=${encodeURIComponent(q)}`); setUserResults(await r.json()); }
        catch { setUserResults([]); }
        finally { setUserSearchLoading(false); }
    }

    async function sendAccessRequest(targetUser) {
        if (!requestingEv) return;
        setRequestStatus("");
        try {
            const r = await fetch(`${API}/api/access-requests`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ evidenceId: requestingEv.id, adminId: user.id, adminName: user.name || user.email || "Admin", targetUserId: targetUser.id, targetUserName: targetUser.name || targetUser.email }),
            });
            const d = await r.json();
            if (r.status === 409) setRequestStatus(`⚠ Request already sent (${d.status})`);
            else if (!r.ok) setRequestStatus("⚠ " + (d.error || "Failed to send"));
            else { setRequestStatus("✅ Request sent to " + (targetUser.name || targetUser.email)); fetchSentRequests(); }
        } catch { setRequestStatus("⚠ Network error"); }
        setTimeout(() => setRequestStatus(""), 4000);
    }

    async function doVerify() {
        setVerifyLoading(true); setVerifyResult(null);
        try { const r = await fetch(`${API}/api/evidence/verify/${encodeURIComponent(verifyInput)}`); setVerifyResult(r.ok ? { ok: true, ev: await r.json() } : { ok: false }); }
        catch { setVerifyResult({ ok: false }); }
        finally { setVerifyLoading(false); }
    }

    async function doUpload() {
        if (!uploadForm.name || !uploadForm.caseNo || !uploadForm.officer || !uploadForm.station) { alert("Please fill all fields"); return; }
        setUploading(true);
        const fd = new FormData();
        Object.entries(uploadForm).forEach(([k, v]) => fd.append(k, v));
        if (file) fd.append("file", file);
        try {
            const r = await fetch(`${API}/api/evidence`, { method: "POST", body: fd });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            setUploadData(d); setUploadDone(true); fetchEvidence();
        } catch (e) { alert("Upload failed: " + e.message); }
        finally { setUploading(false); }
    }

    function handleEvidenceClick(ev) {
        if (grantedIds.has(ev.id)) { setSelected(ev); }
        else { setRequestingEv(ev); setTab("access"); setUserSearch(""); setUserResults([]); setRequestStatus(""); }
    }

    const filtered = evidence.filter(e =>
        (e.name || "").toLowerCase().includes(searchQ.toLowerCase()) ||
        (e.caseNo || "").toLowerCase().includes(searchQ.toLowerCase()) ||
        (e.uploadedBy || "").toLowerCase().includes(searchQ.toLowerCase())
    );
    const blockchainNow = 19851890 + tick;
    const displayName = user?.name || user?.email?.split("@")[0] || (user?.address?.slice(0, 8) + "...");

    const TypeBadge = ({ type }) => (
        <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: (typeColors[type] || "#64748b") + "22", color: typeColors[type] || "#64748b" }}>{type}</span>
    );
    const StatusBadge = ({ status }) => (
        <span style={{ color: statusColors[status], fontSize: 11, fontWeight: 700 }}>● {status?.toUpperCase()}</span>
    );
    const Spinner = () => <div className="spinner" style={{ margin: "0 auto 10px" }} />;

    return (
        <div style={{ minHeight: "100vh", background: "#05070d", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>
            <style>{ADMIN_STYLES}</style>

            {/* Header */}
            <div style={{ background: "rgba(15,23,42,.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(59,130,246,.12)", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
                <div className="admin-header-actions" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flexShrink: 0 }} onClick={() => navigate("/")}>
                        <img src="/logo.jpg" alt="LexChain" style={{ height: 36, borderRadius: 8, objectFit: "contain" }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", letterSpacing: ".05em" }}>LEXCHAIN</div>
                            <div style={{ fontSize: 9, color: "#475569", letterSpacing: ".12em" }}>ADMIN CONSOLE</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
                            <span>#{blockchainNow.toLocaleString()}</span>
                        </div>
                        <div style={{ background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.3)", borderRadius: 8, padding: "4px 10px", color: "#c4b5fd", fontSize: 11 }}>
                            🛡 {displayName}
                        </div>
                        <button className="btn-ghost" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => { logout(); navigate("/"); }}>Sign Out</button>
                    </div>
                </div>
                <div className="tab-scroll" style={{ display: "flex", gap: 2, borderTop: "1px solid rgba(59,130,246,.06)", justifyContent: "center" }}>
                    {[
                        ["dashboard", "📊 Dashboard"],
                        ["evidence", "🗂 Evidence"],
                        ["upload", "⬆ Upload"],
                        ["verify", "🔍 Verify"],
                        ["access", `🔑 Access${sentRequests.filter(r => r.status === "pending").length > 0 ? ` (${sentRequests.filter(r => r.status === "pending").length})` : ""}`],
                        ["court", "🏛 Court"],
                        ["lawyers", "⚖️ Lawyers"],
                        ["cases", "📋 Cases"],
                    ].map(([k, v]) => (
                        <button key={k} className={`tab-btn ${tab === k ? "active" : ""}`}
                            onClick={() => { setTab(k); setSelected(null); setVerifyResult(null); setUploadDone(false); if (k === "access") { fetchSentRequests(); fetchGrants(); } if (k === "lawyers") fetchLawyers(); if (k === "cases") fetchAllCases(); }}>
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <div className="admin-pad" style={{ padding: "28px 24px", maxWidth: 1100, margin: "0 auto" }}>

                {/* ── DASHBOARD ── */}
                {tab === "dashboard" && (
                    <div className="fadein">
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 20 }}>SYSTEM OVERVIEW</div>
                        <div className="stat-grid">
                            {[
                                ["Total Evidence", evidence.length, "#3b82f6", "📂"],
                                ["Verified", evidence.filter(e => e.status === "verified").length, "#22c55e", "✅"],
                                ["Pending", evidence.filter(e => e.status === "pending").length, "#f59e0b", "⏳"],
                                ["Active Cases", new Set(evidence.map(e => e.caseNo)).size, "#ef4444", "⚖"],
                            ].map(([label, val, color, icon]) => (
                                <div key={label} className="card">
                                    <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
                                    <div style={{ fontSize: 34, fontWeight: 800, color, fontFamily: "'IBM Plex Mono', monospace" }}>{val}</div>
                                    <div style={{ fontSize: 11, color: "#334155", marginTop: 4, letterSpacing: ".08em" }}>{label.toUpperCase()}</div>
                                </div>
                            ))}
                        </div>

                        <div className="card" style={{ marginBottom: 20, padding: "18px 22px" }}>
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 12 }}>ACCESS CONTROL STATUS</div>
                            <div style={{ display: "flex", gap: 20, fontSize: 13, flexWrap: "wrap" }}>
                                <span style={{ color: "#22c55e" }}>✅ {grantedIds.size} Accessible</span>
                                <span style={{ color: "#f59e0b" }}>⏳ {sentRequests.filter(r => r.status === "pending").length} Pending</span>
                                <span style={{ color: "#ef4444" }}>🔒 {evidence.length - grantedIds.size} Restricted</span>
                            </div>
                        </div>

                        <div className="card">
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 16 }}>RECENT BLOCKCHAIN ACTIVITY</div>
                            {loading ? <div style={{ color: "#475569", fontSize: 13 }}>Loading...</div> : evidence.slice(0, 5).map((ev, i) => (
                                <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(59,130,246,.06)" : "none", fontSize: 13, gap: 12, flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <TypeBadge type={ev.type} />
                                        <span style={{ color: "#94a3b8" }}>{ev.name}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 14, alignItems: "center", color: "#475569", fontSize: 12 }}>
                                        <span>{ev.caseNo}</span>
                                        <span style={{ color: grantedIds.has(ev.id) ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                                            {grantedIds.has(ev.id) ? "🔓 OPEN" : "🔒 RESTRICTED"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── EVIDENCE LIST ── */}
                {tab === "evidence" && !selected && (
                    <div className="fadein">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em" }}>EVIDENCE REGISTRY · {filtered.length} RECORDS</div>
                            <input className="inp" style={{ width: "min(280px, 100%)" }} placeholder="Search by name, case, officer..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                        </div>
                        <div style={{ background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 14, fontSize: 12, color: "#fbbf24", display: "flex", gap: 10, alignItems: "center" }}>
                            <span>🔒</span> Click any evidence to view (🔓) or request access (🔒)
                        </div>
                        <div className="glass">
                            <div className="ev-table-wrap">
                                <div className="ev-header">
                                    <div>EV ID</div><div>FILE</div><div>OFFICER</div><div>TYPE</div><div>STATUS</div><div>ACCESS</div>
                                </div>
                                {loading ? (
                                    <div style={{ padding: 36, textAlign: "center", fontSize: 12, color: "#475569" }}>
                                        <Spinner />Loading...
                                    </div>
                                ) : filtered.map(ev => (
                                    <div key={ev.id} className="ev-row" onClick={() => handleEvidenceClick(ev)}>
                                        <div style={{ color: "#60a5fa", fontWeight: 700, fontFamily: "monospace", fontSize: 11 }}>{ev.id}</div>
                                        <div>
                                            <div style={{ color: "#cbd5e1", fontWeight: 500 }}>{ev.name}</div>
                                            <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontFamily: "monospace" }}>{ev.caseNo}</div>
                                        </div>
                                        <div style={{ color: "#94a3b8", fontSize: 12 }}>{ev.uploadedBy}</div>
                                        <div><TypeBadge type={ev.type} /></div>
                                        <div><StatusBadge status={ev.status} /></div>
                                        <div>
                                            {grantedIds.has(ev.id)
                                                ? <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700 }}>🔓 OPEN</span>
                                                : <span style={{ color: "#ef4444", fontSize: 11, fontWeight: 700 }}>🔒 REQUEST</span>}
                                        </div>
                                    </div>
                                ))}
                                {!loading && filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "#475569", fontSize: 13 }}>No records found</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── EVIDENCE DETAIL ── */}
                {tab === "evidence" && selected && (
                    <div className="fadein">
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
                            <button className="btn-ghost" onClick={() => setSelected(null)}>← Back</button>
                            <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", letterSpacing: ".08em" }}>EVIDENCE DETAIL · {selected.id}</span>
                            <span style={{ marginLeft: "auto", color: "#22c55e", fontSize: 12, fontWeight: 700 }}>🔓 Access Granted</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginBottom: 20 }}>
                            {[
                                ["FILE METADATA", [["Name", selected.name], ["Case No.", selected.caseNo], ["Type", selected.type], ["Uploaded By", selected.uploadedBy], ["Station", selected.station], ["Timestamp", formatDate(selected.timestamp)]]],
                                ["BLOCKCHAIN PROOF", [["Block Height", `#${selected.blockHeight?.toLocaleString()}`], ["TX Hash", shortHash(selected.txHash)], ["SHA-256 Hash", shortHash(selected.hash)], ["IPFS CID", selected.ipfsCid ? selected.ipfsCid.slice(0, 18) + "..." : "—"], ["Network", "Ethereum Mainnet"], ["Status", selected.status?.toUpperCase()]]],
                            ].map(([title, rows]) => (
                                <div key={title} className="card">
                                    <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>{title}</div>
                                    {rows.map(([k, v]) => (
                                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(59,130,246,.06)", fontSize: 13, gap: 8 }}>
                                            <span style={{ color: "#64748b", flexShrink: 0 }}>{k}</span>
                                            <span style={{ color: k === "Status" ? statusColors[selected.status] : "#94a3b8", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", textAlign: "right" }}>{v}</span>
                                        </div>
                                    ))}
                                    {title === "BLOCKCHAIN PROOF" && (
                                        <div style={{ marginTop: 12, padding: 10, background: "rgba(5,7,13,.6)", borderRadius: 8, fontSize: 10, color: "#475569", wordBreak: "break-all", lineHeight: 1.8 }}>
                                            <div style={{ color: "#3b82f6", marginBottom: 4, fontSize: 9, letterSpacing: ".1em" }}>FULL SHA-256 HASH</div>
                                            {selected.hash}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="card">
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 16 }}>CHAIN OF CUSTODY</div>
                            {(selected.chainOfCustody || []).map((c, i) => (
                                <div key={i} style={{ position: "relative", paddingLeft: 30, marginBottom: 18 }}>
                                    <div style={{ position: "absolute", left: 0, top: 2, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>{i + 1}</div>
                                    {i < (selected.chainOfCustody.length - 1) && <div style={{ position: "absolute", left: 9, top: 22, width: 1, height: "calc(100% + 4px)", background: "rgba(59,130,246,.15)" }} />}
                                    <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 600 }}>{c.action}</div>
                                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{c.officer} · {formatDate(c.time)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── UPLOAD ── */}
                {tab === "upload" && (
                    <div className="fadein" style={{ maxWidth: 580 }}>
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 22 }}>UPLOAD EVIDENCE TO BLOCKCHAIN</div>
                        {!uploadDone ? (
                            <div className="card">
                                <div className="form-grid">
                                    {[["Evidence File Name", "name", "e.g. FIR_2024_Case.pdf"], ["Case Number", "caseNo", "e.g. CR-2024-3001"], ["Uploading Officer", "officer", "e.g. SI Priya Sharma"], ["Police Station", "station", "e.g. Lalbagh PS"]].map(([label, key, ph]) => (
                                        <div key={key}>
                                            <div className="lbl">{label.toUpperCase()}</div>
                                            <input className="inp" placeholder={ph} value={uploadForm[key]} onChange={e => setUploadForm(f => ({ ...f, [key]: e.target.value }))} />
                                        </div>
                                    ))}
                                    <div>
                                        <div className="lbl">EVIDENCE TYPE</div>
                                        <select className="inp" value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))}>
                                            <option>FIR</option><option>CCTV</option><option>Forensic</option><option>Document</option>
                                        </select>
                                    </div>
                                    <div style={{ border: "2px dashed #1e3a6e", borderRadius: 10, padding: 24, textAlign: "center", cursor: "pointer", position: "relative" }}>
                                        <input type="file" onChange={e => setFile(e.target.files[0])} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                                        <div style={{ color: file ? "#60a5fa" : "#475569", fontWeight: file ? 600 : 400, fontSize: 13 }}>{file ? file.name : "Click to select or drag file here"}</div>
                                        <div style={{ fontSize: 11, marginTop: 6, color: "#334155" }}>SHA-256 hash computed locally before upload</div>
                                    </div>
                                    <button className="btn-blue" style={{ padding: "13px", fontSize: 14, width: "100%" }} onClick={doUpload} disabled={uploading}>
                                        {uploading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><span style={{ width: 14, height: 14, border: "2px solid #ffffff44", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />ANCHORING...</span> : "⬆ UPLOAD & ANCHOR TO BLOCKCHAIN"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="card fadein" style={{ textAlign: "center", padding: 44 }}>
                                <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e", marginBottom: 10 }}>EVIDENCE ANCHORED</div>
                                <div style={{ fontSize: 13, color: "#475569", marginBottom: 24 }}>File hash recorded on-chain.</div>
                                {[["TX Hash", shortHash(uploadData?.txHash)], ["Block", `#${uploadData?.blockHeight?.toLocaleString()}`], ["Evidence ID", uploadData?.id]].map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(59,130,246,.08)", fontSize: 12 }}>
                                        <span style={{ color: "#475569" }}>{k}</span>
                                        <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{v}</span>
                                    </div>
                                ))}
                                <button className="btn-ghost" style={{ marginTop: 20 }} onClick={() => { setUploadDone(false); setUploadForm({ name: "", type: "FIR", caseNo: "", officer: "", station: "" }); setFile(null); }}>Upload Another</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── VERIFY ── */}
                {tab === "verify" && (
                    <div className="fadein" style={{ maxWidth: 560 }}>
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 22 }}>VERIFY EVIDENCE AUTHENTICITY</div>
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div className="lbl">ENTER HASH, TX HASH, OR EVIDENCE ID</div>
                            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                                <input className="inp" placeholder="0x... or EV-2024-001" value={verifyInput} onChange={e => { setVerifyInput(e.target.value); setVerifyResult(null); }} style={{ flex: 1 }} />
                                <button className="btn-blue" onClick={doVerify} disabled={verifyLoading || !verifyInput}>{verifyLoading ? "..." : "VERIFY"}</button>
                            </div>
                        </div>
                        {verifyResult && (
                            <div className="card fadein">
                                {verifyResult.ok ? (
                                    <div>
                                        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
                                            <div style={{ fontSize: 34 }}>✅</div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: "#22c55e" }}>AUTHENTICITY VERIFIED</div>
                                                <div style={{ fontSize: 12, color: "#475569" }}>Evidence is unmodified since blockchain anchoring</div>
                                            </div>
                                        </div>
                                        {[["Evidence ID", verifyResult.ev.id], ["File", verifyResult.ev.name], ["Case", verifyResult.ev.caseNo], ["Anchored", formatDate(verifyResult.ev.timestamp)]].map(([k, v]) => (
                                            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(59,130,246,.06)", fontSize: 13 }}>
                                                <span style={{ color: "#64748b" }}>{k}</span><span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: "center", padding: 24 }}>
                                        <div style={{ fontSize: 34, marginBottom: 12 }}>❌</div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: "#ef4444", marginBottom: 8 }}>NOT FOUND</div>
                                        <div style={{ fontSize: 13, color: "#475569" }}>No record matches. Possible tampering or invalid input.</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── ACCESS REQUESTS ── */}
                {tab === "access" && (
                    <div className="fadein">
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 22 }}>ACCESS CONTROL PANEL</div>

                        <div className="card" style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>🔍 Request Access to Evidence</div>

                            {requestingEv ? (
                                <div style={{ background: "rgba(29,78,216,.1)", border: "1px solid rgba(59,130,246,.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#93c5fd", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                    <span>📄 <strong>{requestingEv.name}</strong> — {requestingEv.caseNo}</span>
                                    <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => { setRequestingEv(null); setUserSearch(""); setUserResults([]); }}>✕ Clear</button>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 16 }}>
                                    <div className="lbl">SELECT EVIDENCE TO REQUEST ACCESS FOR:</div>
                                    <select className="inp" onChange={e => { const ev = evidence.find(ev => ev.id === e.target.value); setRequestingEv(ev || null); setUserSearch(""); setUserResults([]); }}>
                                        <option value="">— Pick an evidence record —</option>
                                        {evidence.filter(ev => !grantedIds.has(ev.id)).map(ev => (
                                            <option key={ev.id} value={ev.id}>{ev.id} — {ev.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {requestingEv && (
                                <>
                                    <div className="lbl" style={{ marginBottom: 8 }}>SEARCH USER BY NAME / EMAIL:</div>
                                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                                        <input className="inp" placeholder="Type user name or email..." value={userSearch} onChange={e => { setUserSearch(e.target.value); searchUsers(e.target.value); }} style={{ flex: 1 }} />
                                        {userSearchLoading && <div className="spinner" style={{ alignSelf: "center", flexShrink: 0 }} />}
                                    </div>
                                    {requestStatus && (
                                        <div style={{ padding: "8px 12px", borderRadius: 8, background: requestStatus.startsWith("✅") ? "rgba(34,197,94,.1)" : "rgba(245,158,11,.1)", border: `1px solid ${requestStatus.startsWith("✅") ? "rgba(34,197,94,.3)" : "rgba(245,158,11,.3)"}`, fontSize: 13, marginBottom: 12, color: requestStatus.startsWith("✅") ? "#22c55e" : "#f59e0b" }}>
                                            {requestStatus}
                                        </div>
                                    )}
                                    {userResults.map(u => (
                                        <div key={u.id} className="user-result-row">
                                            <div>
                                                <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{u.name || "—"}</div>
                                                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{u.email || u.address || u.loginMethod}</div>
                                            </div>
                                            <button className="btn-gold" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => sendAccessRequest(u)}>Send Request</button>
                                        </div>
                                    ))}
                                    {userSearch.length >= 2 && userResults.length === 0 && !userSearchLoading && (
                                        <div style={{ fontSize: 13, color: "#475569", padding: "10px 0" }}>No users found matching "{userSearch}"</div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>📋 Sent Access Requests</div>
                                <button className="btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => { fetchSentRequests(); fetchGrants(); }}>↻ Refresh</button>
                            </div>
                            {sentRequests.length === 0 ? (
                                <div style={{ fontSize: 13, color: "#475569", padding: "20px 0", textAlign: "center" }}>No access requests sent yet.</div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 70px 100px", gap: 12, padding: "8px 16px", background: "rgba(5,7,13,.5)", fontSize: 10, color: "#334155", letterSpacing: ".1em", borderRadius: 6, marginBottom: 4, minWidth: 400 }}>
                                        <div>EVIDENCE</div><div>SENT TO</div><div>DATE</div><div>STATUS</div>
                                    </div>
                                    {sentRequests.map(req => (
                                        <div key={req.id} className="req-row" style={{ minWidth: 400 }}>
                                            <div>
                                                <div style={{ color: "#cbd5e1", fontWeight: 500 }}>{req.evidenceName || req.evidenceId}</div>
                                                <div style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>{req.caseNo}</div>
                                            </div>
                                            <div style={{ color: "#94a3b8", fontSize: 12 }}>{req.targetUserName}</div>
                                            <div style={{ color: "#475569", fontSize: 11 }}>{new Date(req.createdAt).toLocaleDateString()}</div>
                                            <div>
                                                <span style={{
                                                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                    background: req.status === "accepted" ? "rgba(34,197,94,.15)" : req.status === "declined" ? "rgba(239,68,68,.15)" : "rgba(245,158,11,.15)",
                                                    color: req.status === "accepted" ? "#22c55e" : req.status === "declined" ? "#ef4444" : "#f59e0b"
                                                }}>
                                                    {req.status === "accepted" ? "✓ ACCEPTED" : req.status === "declined" ? "✗ DECLINED" : "⏳ PENDING"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── COURT VIEW ── */}
                {tab === "court" && (
                    <div className="fadein">
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 18 }}>COURT OF LAW · READ-ONLY ACCESS</div>
                        <div style={{ background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#fbbf24", display: "flex", gap: 10, alignItems: "center" }}>
                            <span>⚠</span> This view is provided to the Hon. Court. All records are read-only and cryptographically tamper-evident.
                        </div>
                        {evidence.map(ev => (
                            <div key={ev.id} className="card" style={{ marginBottom: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{ev.name}</div>
                                        <div style={{ fontSize: 12, color: "#475569" }}>{ev.caseNo} · {ev.uploadedBy} · {ev.station}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <TypeBadge type={ev.type} />
                                        <StatusBadge status={ev.status} />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, background: "rgba(5,7,13,.5)", borderRadius: 8, padding: 12, fontSize: 12 }}>
                                    {[["BLOCK HEIGHT", `#${ev.blockHeight?.toLocaleString()}`], ["TX HASH", shortHash(ev.txHash)], ["TIMESTAMP", formatDate(ev.timestamp)]].map(([k, v]) => (
                                        <div key={k}>
                                            <div style={{ color: "#334155", fontSize: 10, marginBottom: 4, letterSpacing: ".08em" }}>{k}</div>
                                            <div style={{ color: "#94a3b8", fontFamily: "monospace" }}>{v}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 8, fontSize: 10, color: "#334155", wordBreak: "break-all", fontFamily: "monospace" }}>SHA-256: {ev.hash}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── LAWYERS TAB ── */}
                {tab === "lawyers" && (
                    <div className="fadein">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em" }}>LAWYER VERIFICATION MANAGEMENT · {lawyers.length} registered</div>
                            <button className="btn-ghost" onClick={fetchLawyers} style={{ fontSize: 12 }}>↻ Refresh</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
                            {[["Total", lawyers.length, "#3b82f6"], ["Verified", lawyers.filter(l => l.verified).length, "#22c55e"], ["Pending", lawyers.filter(l => !l.verified).length, "#f59e0b"]].map(([l, v, c]) => (
                                <div key={l} className="card" style={{ padding: 16 }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: "monospace" }}>{v}</div>
                                    <div style={{ fontSize: 10, color: "#475569", marginTop: 3, letterSpacing: ".08em" }}>{l.toUpperCase()}</div>
                                </div>
                            ))}
                        </div>
                        {lawyersLoading ? <div style={{ textAlign: "center", padding: 36, color: "#475569" }}>Loading lawyers...</div> : lawyers.map(l => (
                            <div key={l.id} className="card" style={{ marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", marginBottom: 4 }}>⚖️ {l.name}</div>
                                        <div style={{ fontSize: 12, color: "#d4a017", marginBottom: 4 }}>{l.specialization} · {l.experience} yrs exp · ₹{l.fee?.toLocaleString()}/consultation</div>
                                        <div style={{ fontSize: 12, color: "#475569" }}>Bar Council: <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{l.barCouncilId}</span> · {l.courtName} · {l.city}</div>
                                        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{l.email} · {l.phone}</div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                                        <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: l.verified ? "rgba(34,197,94,.15)" : "rgba(245,158,11,.1)", color: l.verified ? "#22c55e" : "#f59e0b" }}>
                                            {l.verified ? "✅ VERIFIED" : "⏳ PENDING"}
                                        </span>
                                        <button onClick={() => toggleLawyerVerify(l)} className={l.verified ? "btn-ghost" : "btn-green"} style={{ fontSize: 12, padding: "6px 14px" }}>
                                            {l.verified ? "Revoke" : "✓ Verify Lawyer"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {lawyers.length === 0 && !lawyersLoading && <div className="glass" style={{ padding: 40, textAlign: "center", color: "#475569" }}>No lawyers registered yet.</div>}
                    </div>
                )}

                {/* ── ALL CASES TAB ── */}
                {tab === "cases" && (
                    <div className="fadein">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em" }}>ALL CASES · {allCases.length} total</div>
                            <button className="btn-ghost" onClick={fetchAllCases} style={{ fontSize: 12 }}>↻ Refresh</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 20 }}>
                            {[["Total", allCases.length, "#3b82f6"], ["Open", allCases.filter(c => c.status != "closed").length, "#d4a017"], ["Closed", allCases.filter(c => c.status == "closed").length, "#22c55e"]].map(([l, v, c]) => (
                                <div key={l} className="card" style={{ padding: 16 }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: "monospace" }}>{v}</div>
                                    <div style={{ fontSize: 10, color: "#475569", marginTop: 3, letterSpacing: ".08em" }}>{l.toUpperCase()}</div>
                                </div>
                            ))}
                        </div>
                        {casesLoading ? <div style={{ textAlign: "center", padding: 36, color: "#475569" }}>Loading cases...</div> : allCases.map(c => (
                            <div key={c.id} className="card" style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", marginBottom: 4 }}>{c.title}</div>
                                        <div style={{ fontSize: 12, color: "#475569" }}>
                                            <span style={{ color: "#60a5fa", fontFamily: "monospace", marginRight: 12 }}>{c.id}</span>
                                            {c.category} · Filed by <strong style={{ color: "#94a3b8" }}>{c.filedByName}</strong> · {new Date(c.createdAt).toLocaleDateString()}
                                        </div>
                                        {c.assignedLawyerName && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>⚖️ {c.assignedLawyerName}</div>}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                                        <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: (c.status === "closed" ? "#22c55e" : c.status === "hearing_scheduled" ? "#06b6d4" : "#3b82f6") + "22", color: c.status == "closed" ? "#22c55e" : c.status == "hearing_scheduled" ? "#06b6d4" : "#3b82f6" }}>{c.status?.replace(/_/g, " ").toUpperCase()}</span>
                                        <select className="inp" style={{ padding: "4px 8px", fontSize: 12, width: 140 }} value={c.status} onChange={async e => {
                                            await fetch(`${API}/api/cases/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) });
                                            fetchAllCases();
                                        }}>
                                            {["filed", "lawyer_assigned", "under_review", "hearing_scheduled", "judgement_issued", "closed"].map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {allCases.length === 0 && !casesLoading && <div className="glass" style={{ padding: 40, textAlign: "center", color: "#475569" }}>No cases filed yet.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
