import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const STATUS_COLOR = { filed: "#3b82f6", lawyer_assigned: "#d4a017", under_review: "#7c3aed", hearing_scheduled: "#06b6d4", judgement_issued: "#f59e0b", closed: "#22c55e" };

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#1e3a6e;border-radius:2px}
.glass{background:rgba(15,23,42,.7);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(212,160,23,.12);border-radius:14px;}
.card{background:rgba(15,23,42,.7);border:1px solid rgba(212,160,23,.12);border-radius:12px;padding:18px;}
.btn{cursor:pointer;background:linear-gradient(135deg,#d4a017,#b8860b);border:none;border-radius:8px;padding:10px 20px;color:#020818;font-family:inherit;font-size:13px;font-weight:700;transition:all .2s;min-height:40px;touch-action:manipulation;}
.btn:hover{opacity:.85;transform:translateY(-1px);}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-ghost{cursor:pointer;background:transparent;border:1px solid #1e3a6e;border-radius:8px;padding:8px 16px;color:#94a3b8;font-family:inherit;font-size:13px;transition:all .2s;min-height:36px;touch-action:manipulation;}
.btn-ghost:hover{border-color:#d4a017;color:#e2e8f0;}
.inp{width:100%;padding:11px 13px;background:rgba(5,7,13,.8);border:1px solid #1e3a6e;border-radius:8px;color:#e2e8f0;font-size:16px;font-family:inherit;outline:none;transition:border-color .2s;-webkit-appearance:none;appearance:none;}
.inp:focus{border-color:#d4a017;}
.inp::placeholder{color:#475569;}
.tab-btn{cursor:pointer;padding:10px 14px;border-bottom:2px solid transparent;color:#64748b;font-size:13px;font-weight:600;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit;transition:all .15s;white-space:nowrap;min-height:40px;touch-action:manipulation;}
.tab-btn.on{border-bottom-color:#d4a017;color:#e2e8f0;}
.tab-scroll{overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.tab-scroll::-webkit-scrollbar{display:none;}
.lbl{font-size:10px;color:#64748b;letter-spacing:.1em;font-weight:600;margin-bottom:5px;text-transform:uppercase;}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fadein{animation:fadein .3s ease;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.spinner{width:22px;height:22px;border:2px solid #1e3a6e;border-top-color:#d4a017;border-radius:50%;animation:spin 1s linear infinite;}
.dash-theme-btn{position:fixed;bottom:20px;right:20px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:999;width:44px;height:44px;border-radius:50%;border:1px solid rgba(212,160,23,.35);background:rgba(15,23,42,.95);color:#d4a017;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.4);transition:all .25s;touch-action:manipulation;}
.dash-theme-btn:hover{transform:scale(1.15) rotate(15deg);border-color:#d4a017;}

/* Responsive */
@media(max-width:768px){
  .lawyer-pad{padding:14px!important;}
  .nav-row{flex-wrap:wrap;gap:6px!important;}
  .bar-info{display:none!important;}
  .stat-grid{grid-template-columns:repeat(3,1fr)!important;gap:10px;}
  .detail-grid{grid-template-columns:1fr!important;}
  .card{padding:14px!important;}
  .case-meta{flex-direction:column;gap:4px!important;}
}
@media(max-width:480px){
  .stat-grid{grid-template-columns:repeat(3,1fr)!important;}
}
`;

function StatusBadge({ status }) {
    const col = STATUS_COLOR[status] || "#64748b";
    const label = status?.replace("_", " ").toUpperCase() || "UNKNOWN";
    return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: col + "22", color: col, whiteSpace: "nowrap" }}>{label}</span>;
}
function formatDate(iso) { return iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"; }

export default function LawyerDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [tab, setTab] = useState("cases");
    const [cases, setCases] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [docText, setDocText] = useState("");
    const [docName, setDocName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [docDone, setDocDone] = useState(false);

    const fetchCases = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/api/cases?role=lawyer&lawyerId=${encodeURIComponent(user?.id || "")}`);
            setCases(await r.json());
        } catch { setCases([]); }
        finally { setLoading(false); }
    }, [user?.id]);

    async function loadCase(c) {
        try {
            const r = await fetch(`${API}/api/cases/${c.id}`);
            setSelected(await r.json());
        } catch { setSelected(c); }
        setTab("detail");
    }

    async function submitDocument() {
        if (!docName || !docText) return;
        setSubmitting(true);
        const fd = new FormData();
        fd.append("name", docName); fd.append("type", "Document"); fd.append("caseNo", selected?.id || "");
        fd.append("caseId", selected?.id || ""); fd.append("officer", user?.name || "Lawyer"); fd.append("station", "Legal Chamber");
        try {
            await fetch(`${API}/api/evidence`, { method: "POST", body: fd });
            setDocDone(true); setDocName(""); setDocText("");
            setTimeout(() => setDocDone(false), 3000);
        } catch { alert("Failed to submit document"); }
        finally { setSubmitting(false); }
    }

    useEffect(() => { fetchCases(); }, [fetchCases]);

    const displayName = user?.name || user?.email?.split("@")[0] || "Lawyer";
    const pending = cases.filter(c => c.status === "lawyer_assigned" || c.status === "under_review").length;
    const closed = cases.filter(c => c.status === "closed").length;

    const navBg = isDark ? "rgba(15,23,42,.95)" : "rgba(245,242,232,.97)";
    const pageBg = isDark ? "#05070d" : "#f0ede6";
    const textPrimary = isDark ? "#e2e8f0" : "#1a1a2e";

    return (
        <div style={{ minHeight: "100dvh", background: pageBg, fontFamily: "'Inter',sans-serif", color: textPrimary }}>
            <style>{STYLES}</style>
            <button className="dash-theme-btn" onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"} aria-label="Toggle theme">{isDark ? "☀️" : "🌙"}</button>

            {/* Navbar */}
            <div style={{ background: navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,160,23,.1)", padding: "0 16px", position: "sticky", top: 0, zIndex: 50 }}>
                <div className="nav-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 60, gap: 8, padding: "8px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }} onClick={() => navigate("/")}>
                        <img src="/logo.jpg" alt="LexChain" style={{ height: 30, borderRadius: 7 }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>LEXCHAIN</div>
                            <div style={{ fontSize: 9, color: "#475569", letterSpacing: ".1em" }}>LAWYER PORTAL</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div className="bar-info" style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>{user?.barCouncilId}</div>
                        <div style={{ background: "rgba(212,160,23,.12)", border: "1px solid rgba(212,160,23,.25)", borderRadius: 8, padding: "4px 10px", color: "#d4a017", fontSize: 11, fontWeight: 700, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>⚖️ {displayName}</div>
                        {!user?.verified && <div style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 7, padding: "3px 8px", color: "#fbbf24", fontSize: 11 }}>⏳ Pending</div>}
                        <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => { logout(); navigate("/"); }}>Sign Out</button>
                    </div>
                </div>
                <div className="tab-scroll" style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(212,160,23,.06)" }}>
                    {[["cases", "📋 My Cases"], ["documents", "📄 Upload Doc"], ["profile", "👤 Profile"]].map(([k, v]) => (
                        <button key={k} className={`tab-btn ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); if (k === "cases") { setSelected(null); fetchCases(); } }}>{v}</button>
                    ))}
                    {selected && <button className={`tab-btn ${tab === "detail" ? "on" : ""}`} onClick={() => setTab("detail")}>🗂 {selected.id?.slice(-8)}</button>}
                </div>
            </div>

            <div className="lawyer-pad" style={{ padding: "20px 16px", maxWidth: 1050, margin: "0 auto" }}>

                {/* Stats */}
                {tab !== "detail" && (
                    <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 20 }}>
                        {[["Total Cases", cases.length, "#3b82f6", "📋"], ["Active", pending, "#d4a017", "⚖️"], ["Closed", closed, "#22c55e", "✅"]].map(([l, v, c, i]) => (
                            <div key={l} className="card">
                                <div style={{ fontSize: 18, marginBottom: 6 }}>{i}</div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: c, fontFamily: "monospace" }}>{v}</div>
                                <div style={{ fontSize: 10, color: "#475569", marginTop: 3, letterSpacing: ".08em" }}>{l.toUpperCase()}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* My Cases */}
                {tab === "cases" && (
                    <div className="fadein">
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>ASSIGNED CASES</div>
                        {loading ? <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><div className="spinner" style={{ margin: "0 auto 12px" }} />Loading cases...</div>
                            : cases.length === 0 ? (
                                <div className="glass" style={{ padding: 48, textAlign: "center" }}>
                                    <div style={{ fontSize: 48, marginBottom: 14 }}>⚖️</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>No cases assigned yet</div>
                                    <div style={{ fontSize: 13, color: "#475569" }}>When a citizen hires you, their case will appear here.</div>
                                </div>
                            ) : cases.map(c => (
                                <div key={c.id} className="card fadein" style={{ marginBottom: 12, cursor: "pointer", transition: "border-color .2s" }} onClick={() => loadCase(c)}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,160,23,.35)"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(212,160,23,.12)"}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", marginBottom: 4 }}>{c.title}</div>
                                            <div className="case-meta" style={{ fontSize: 12, color: "#475569", marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                <span style={{ color: "#60a5fa", fontFamily: "monospace" }}>{c.id}</span>
                                                <span>{c.category}</span>
                                                <span>· {new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ fontSize: 12, color: "#94a3b8" }}>👤 Client: <strong>{c.filedByName}</strong></div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                                            <StatusBadge status={c.status} />
                                            <span style={{ fontSize: 11, color: "#475569" }}>View Details →</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* Case Detail */}
                {tab === "detail" && selected && (
                    <div className="fadein">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                            <button className="btn-ghost" onClick={() => { setTab("cases"); setSelected(null); }}>← Back</button>
                            <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>CASE DETAIL · {selected.id}</span>
                            <div style={{ marginLeft: "auto" }}><StatusBadge status={selected.status} /></div>
                        </div>
                        <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 16 }}>
                            <div className="card">
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>CASE INFORMATION</div>
                                {[["Title", selected.title], ["Category", selected.category], ["Location", selected.location || "—"], ["Incident Date", selected.incidentDate || "—"], ["Filed By", selected.filedByName], ["Opponent", selected.opponentName || "—"], ["Filed", formatDate(selected.createdAt)]].map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(212,160,23,.06)", fontSize: 13, gap: 8 }}>
                                        <span style={{ color: "#64748b", flexShrink: 0 }}>{k}</span>
                                        <span style={{ color: "#94a3b8", textAlign: "right", wordBreak: "break-word" }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="card">
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>CASE DESCRIPTION</div>
                                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{selected.description}</p>
                                {(selected.evidence || []).length > 0 && (
                                    <>
                                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginTop: 16, marginBottom: 10 }}>EVIDENCE ({selected.evidence.length})</div>
                                        {selected.evidence.map(ev => (
                                            <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", background: "rgba(5,7,13,.5)", borderRadius: 8, marginBottom: 6, fontSize: 12, flexWrap: "wrap", gap: 6 }}>
                                                <span style={{ color: "#cbd5e1" }}>📄 {ev.name}</span>
                                                <span style={{ color: ev.courtApproval === "approved" ? "#22c55e" : ev.courtApproval === "rejected" ? "#ef4444" : "#f59e0b", fontSize: 11 }}>
                                                    {ev.courtApproval === "approved" ? "✅ Approved" : ev.courtApproval === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                                                </span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Hearings */}
                        {(selected.hearings || []).length > 0 && (
                            <div className="card" style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>📅 SCHEDULED HEARINGS</div>
                                {selected.hearings.map((h, i) => (
                                    <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(212,160,23,.06)", fontSize: 13, flexWrap: "wrap", gap: 8 }}>
                                        <div>
                                            <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{h.hearingDate} at {h.hearingTime}</div>
                                            <div style={{ color: "#475569", fontSize: 12, marginTop: 3 }}>📍 {h.venue} {h.notes && `· ${h.notes}`}</div>
                                        </div>
                                        <span style={{ padding: "3px 10px", background: "rgba(6,182,212,.12)", border: "1px solid rgba(6,182,212,.25)", borderRadius: 20, fontSize: 11, color: "#06b6d4" }}>Hearing #{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Court Orders */}
                        {(selected.courtOrders || []).length > 0 && (
                            <div className="card">
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>📜 COURT ORDERS</div>
                                {selected.courtOrders.map(o => (
                                    <div key={o.id} style={{ padding: "12px", background: "rgba(5,7,13,.5)", borderRadius: 10, marginBottom: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                                            <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>🏛️ {o.judgeName}</span>
                                            <span style={{ color: o.verdict === "acquitted" ? "#22c55e" : o.verdict === "convicted" ? "#ef4444" : "#f59e0b", fontSize: 11, fontWeight: 700 }}>{o.verdict?.toUpperCase()}</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{o.orderText}</p>
                                        <div style={{ fontSize: 10, color: "#334155", marginTop: 8, fontFamily: "monospace", wordBreak: "break-all" }}>Hash: {o.hash?.slice(0, 30)}...</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Document */}
                {tab === "documents" && (
                    <div className="fadein" style={{ maxWidth: 560 }}>
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 20 }}>UPLOAD LEGAL DOCUMENT</div>
                        <div className="card">
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                    <div className="lbl">SELECT CASE</div>
                                    <select className="inp" onChange={e => { const c = cases.find(c => c.id === e.target.value); setSelected(c || null); }}>
                                        <option value="">— Select a case —</option>
                                        {cases.map(c => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div className="lbl">DOCUMENT NAME</div>
                                    <input className="inp" placeholder="e.g. Written Arguments, Bail Application" value={docName} onChange={e => setDocName(e.target.value)} />
                                </div>
                                <div>
                                    <div className="lbl">DOCUMENT CONTENT / ARGUMENTS</div>
                                    <textarea className="inp" rows={6} placeholder="Enter legal arguments, motion text, or document contents..." value={docText} onChange={e => setDocText(e.target.value)} style={{ resize: "vertical", lineHeight: 1.7 }} />
                                </div>
                                {docDone && <div style={{ padding: "10px 14px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 8, fontSize: 13, color: "#86efac" }}>✅ Document submitted and anchored to blockchain!</div>}
                                <button className="btn" onClick={submitDocument} disabled={submitting || !selected || !docName}>
                                    {submitting ? "Submitting..." : "📤 Submit & Anchor to Blockchain"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile */}
                {tab === "profile" && (
                    <div className="fadein" style={{ maxWidth: 560 }}>
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 20 }}>MY LAWYER PROFILE</div>
                        <div className="card">
                            <div style={{ textAlign: "center", marginBottom: 22 }}>
                                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#d4a017,#b8860b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 12px" }}>⚖️</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>{user?.name}</div>
                                <div style={{ marginTop: 10 }}>{user?.verified ? <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>✅ Verified Lawyer</span> : <span style={{ color: "#f59e0b", fontSize: 12 }}>⏳ Awaiting Admin Verification</span>}</div>
                            </div>
                            {[["Bar Council ID", user?.barCouncilId], ["License No.", user?.licenseNo], ["Specialization", user?.specialization], ["Experience", user?.experience ? `${user.experience} years` : "—"], ["Consultation Fee", user?.fee ? `₹${user.fee}` : "—"], ["City", user?.city], ["Phone", user?.phone]].map(([k, v]) => (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(212,160,23,.07)", fontSize: 13, gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ color: "#64748b" }}>{k}</span>
                                    <span style={{ color: "#94a3b8", wordBreak: "break-word", textAlign: "right" }}>{v || "—"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
