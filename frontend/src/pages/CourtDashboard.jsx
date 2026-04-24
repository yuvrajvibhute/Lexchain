import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const STATUS_COLOR = { filed: "#3b82f6", lawyer_assigned: "#d4a017", under_review: "#7c3aed", hearing_scheduled: "#06b6d4", judgement_issued: "#f59e0b", closed: "#22c55e" };

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#2e1f70;border-radius:2px}
.glass{background:rgba(13,10,30,.75);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(124,58,237,.15);border-radius:14px;}
.card{background:rgba(13,10,30,.75);border:1px solid rgba(124,58,237,.12);border-radius:12px;padding:18px;}
.btn-p{cursor:pointer;background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;border-radius:8px;padding:10px 20px;color:#fff;font-family:inherit;font-size:13px;font-weight:700;transition:all .2s;min-height:40px;touch-action:manipulation;}
.btn-p:hover{opacity:.85;transform:translateY(-1px);}
.btn-p:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-g{cursor:pointer;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.28);border-radius:8px;padding:8px 16px;color:#22c55e;font-family:inherit;font-size:13px;font-weight:700;transition:all .2s;min-height:36px;touch-action:manipulation;}
.btn-g:hover{background:rgba(34,197,94,.22);}
.btn-r{cursor:pointer;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:8px 16px;color:#ef4444;font-family:inherit;font-size:13px;font-weight:700;transition:all .2s;min-height:36px;touch-action:manipulation;}
.btn-r:hover{background:rgba(239,68,68,.2);}
.btn-ghost{cursor:pointer;background:transparent;border:1px solid rgba(124,58,237,.2);border-radius:8px;padding:8px 16px;color:#94a3b8;font-family:inherit;font-size:13px;transition:all .2s;min-height:36px;touch-action:manipulation;}
.btn-ghost:hover{border-color:#7c3aed;color:#e2e8f0;}
.inp{width:100%;padding:11px 13px;background:rgba(5,2,18,.8);border:1px solid rgba(124,58,237,.2);border-radius:8px;color:#e2e8f0;font-size:16px;font-family:inherit;outline:none;transition:border-color .2s;-webkit-appearance:none;appearance:none;}
.inp:focus{border-color:#7c3aed;}
.inp::placeholder{color:#475569;}
.inp option{background:#0d0a1e;}
.tab-btn{cursor:pointer;padding:10px 14px;border-bottom:2px solid transparent;color:#64748b;font-size:13px;font-weight:600;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit;transition:all .15s;white-space:nowrap;min-height:40px;touch-action:manipulation;}
.tab-btn.on{border-bottom-color:#7c3aed;color:#e2e8f0;}
.tab-scroll{overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.tab-scroll::-webkit-scrollbar{display:none;}
.lbl{font-size:10px;color:#64748b;letter-spacing:.1em;font-weight:600;margin-bottom:5px;text-transform:uppercase;}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px;}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fadein{animation:fadein .3s ease;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.spinner{width:22px;height:22px;border:2px solid #2e1f70;border-top-color:#7c3aed;border-radius:50%;animation:spin 1s linear infinite;}
.dash-theme-btn{position:fixed;bottom:20px;right:20px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:999;width:44px;height:44px;border-radius:50%;border:1px solid rgba(124,58,237,.35);background:rgba(13,10,30,.95);color:#a78bfa;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.4);transition:all .25s;touch-action:manipulation;}
.dash-theme-btn:hover{transform:scale(1.15) rotate(15deg);border-color:#7c3aed;}

/* Responsive */
@media(max-width:768px){
  .court-pad{padding:14px!important;}
  .nav-row{flex-wrap:wrap;gap:6px!important;}
  .nav-info{display:none!important;}
  .stat-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px;}
  .detail-grid{grid-template-columns:1fr!important;}
  .hearing-grid{grid-template-columns:1fr!important;}
  .ev-actions{flex-wrap:wrap;gap:6px;}
  .card{padding:14px!important;}
}
@media(max-width:480px){
  .stat-grid{grid-template-columns:repeat(2,1fr)!important;}
  .back-row{flex-wrap:wrap;gap:8px;}
}
`;

function StatusBadge({ status }) {
    const col = STATUS_COLOR[status] || "#64748b";
    return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: col + "22", color: col, whiteSpace: "nowrap" }}>{status?.replace(/_/g, " ").toUpperCase()}</span>;
}
function formatDate(iso) { return iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"; }

export default function CourtDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [tab, setTab] = useState("overview");
    const [allCases, setAllCases] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hearing form
    const [hDate, setHDate] = useState("");
    const [hTime, setHTime] = useState("10:00");
    const [hVenue, setHVenue] = useState("Court Hall 1");
    const [hNotes, setHNotes] = useState("");
    const [hCaseId, setHCaseId] = useState("");
    const [schedulingDone, setSchedulingDone] = useState(false);

    // Judgement form
    const [jCaseId, setJCaseId] = useState("");
    const [jText, setJText] = useState("");
    const [jVerdict, setJVerdict] = useState("pending");
    const [jDone, setJDone] = useState(null);

    const fetchCases = useCallback(async () => {
        setLoading(true);
        try { const r = await fetch(`${API}/api/cases`); setAllCases(await r.json()); }
        catch { setAllCases([]); }
        finally { setLoading(false); }
    }, []);

    async function loadCase(c) {
        try { const r = await fetch(`${API}/api/cases/${c.id}`); setSelected(await r.json()); }
        catch { setSelected(c); }
        setTab("case-detail");
    }

    async function scheduleHearing() {
        if (!hCaseId || !hDate) return;
        const caseObj = allCases.find(c => c.id === hCaseId);
        const r = await fetch(`${API}/api/hearings`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caseId: hCaseId, caseTitle: caseObj?.title, hearingDate: hDate, hearingTime: hTime, venue: hVenue, notes: hNotes, scheduledBy: user?.id, scheduledByName: user?.name })
        });
        if (r.ok) {
            await fetch(`${API}/api/cases/${hCaseId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "hearing_scheduled" }) });
            setSchedulingDone(true); setHDate(""); setHNotes("");
            setTimeout(() => setSchedulingDone(false), 3500);
        }
    }

    async function submitJudgement() {
        if (!jCaseId || !jText) return;
        const caseObj = allCases.find(c => c.id === jCaseId);
        const r = await fetch(`${API}/api/court-orders`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caseId: jCaseId, caseTitle: caseObj?.title, judgeId: user?.id, judgeName: user?.name, orderText: jText, verdict: jVerdict })
        });
        const d = await r.json();
        if (r.ok) { setJDone(d); setJText(""); setTimeout(() => setJDone(null), 5000); }
    }

    async function approveEvidence(evId, approval) {
        await fetch(`${API}/api/evidence/${evId}/approval`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courtApproval: approval, judgeName: user?.name })
        });
        if (selected) {
            const r = await fetch(`${API}/api/cases/${selected.id}`);
            setSelected(await r.json());
        }
    }

    useEffect(() => { fetchCases(); }, [fetchCases]);

    const displayName = user?.name || "Judge";
    const open = allCases.filter(c => c.status !== "closed").length;
    const closed = allCases.filter(c => c.status === "closed").length;
    const hearingsSched = allCases.filter(c => c.status === "hearing_scheduled").length;

    const navBg = isDark ? "rgba(13,10,30,.95)" : "rgba(245,240,255,.97)";
    const pageBg = isDark ? "#050210" : "#eeebf5";
    const textPrimary = isDark ? "#e2e8f0" : "#1a0a3e";

    return (
        <div style={{ minHeight: "100vh", minHeight: "100dvh", background: pageBg, fontFamily: "'Inter',sans-serif", color: textPrimary }}>
            <style>{STYLES}</style>
            <button className="dash-theme-btn" onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"} aria-label="Toggle theme">{isDark ? "☀️" : "🌙"}</button>

            {/* Navbar */}
            <div style={{ background: navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(124,58,237,.12)", padding: "0 16px", position: "sticky", top: 0, zIndex: 50 }}>
                <div className="nav-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 60, gap: 10, padding: "8px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }} onClick={() => navigate("/")}>
                        <img src="/logo.jpg" alt="LexChain" style={{ height: 30, borderRadius: 7 }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>LEXCHAIN</div>
                            <div style={{ fontSize: 9, color: "#475569", letterSpacing: ".1em" }}>COURT PANEL</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.3)", borderRadius: 8, padding: "4px 10px", color: "#c4b5fd", fontSize: 11, fontWeight: 700, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🏛️ {displayName}</div>
                        <div className="nav-info" style={{ color: "#475569", fontSize: 11 }}>{user?.post}</div>
                        <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => { logout(); navigate("/"); }}>Sign Out</button>
                    </div>
                </div>
                {/* Tab bar */}
                <div className="tab-scroll" style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(124,58,237,.06)" }}>
                    {[["overview", "📊 Overview"], ["cases", "⚖️ Cases"], ["verify", "🔍 Verify"], ["hearings", "📅 Hearing"], ["judgements", "📜 Judgement"]].map(([k, v]) => (
                        <button key={k} className={`tab-btn ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); if (k === "cases") { setSelected(null); fetchCases(); } }}>{v}</button>
                    ))}
                    {selected && <button className={`tab-btn ${tab === "case-detail" ? "on" : ""}`} onClick={() => setTab("case-detail")}>🗂 {selected.id?.slice(-8)}</button>}
                </div>
            </div>

            <div className="court-pad" style={{ padding: "20px 16px", maxWidth: 1050, margin: "0 auto" }}>

                {/* Overview */}
                {tab === "overview" && (
                    <div className="fadein">
                        <div className="stat-grid">
                            {[["Total Cases", allCases.length, "#7c3aed", "⚖️"], ["Open", open, "#3b82f6", "📂"], ["Hearings Set", hearingsSched, "#06b6d4", "📅"], ["Closed", closed, "#22c55e", "✅"]].map(([l, v, c, i]) => (
                                <div key={l} className="card">
                                    <div style={{ fontSize: 18, marginBottom: 6 }}>{i}</div>
                                    <div className="stat-big" style={{ fontSize: 26, fontWeight: 800, color: c, fontFamily: "monospace" }}>{v}</div>
                                    <div style={{ fontSize: 10, color: "#475569", marginTop: 3, letterSpacing: ".08em" }}>{l.toUpperCase()}</div>
                                </div>
                            ))}
                        </div>
                        <div className="card">
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 16 }}>RECENT CASES</div>
                            {loading ? <div style={{ color: "#475569", fontSize: 13 }}>Loading...</div> : allCases.slice(0, 6).map(c => (
                                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(124,58,237,.07)", fontSize: 13, flexWrap: "wrap", gap: 8, cursor: "pointer" }} onClick={() => loadCase(c)}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ color: "#a78bfa", fontFamily: "monospace", fontSize: 11, marginRight: 8 }}>{c.id?.slice(-10)}</span>
                                        <span style={{ color: "#cbd5e1" }}>{c.title}</span>
                                    </div>
                                    <StatusBadge status={c.status} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Cases */}
                {tab === "cases" && !selected && (
                    <div className="fadein">
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>ALL CASES · {allCases.length} TOTAL</div>
                        {loading ? <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><div className="spinner" style={{ margin: "0 auto 12px" }} />Loading...</div>
                            : allCases.map(c => (
                                <div key={c.id} className="card fadein" style={{ marginBottom: 12, cursor: "pointer", transition: "border-color .2s" }}
                                    onClick={() => loadCase(c)}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.4)"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.12)"}>
                                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", marginBottom: 4 }}>{c.title}</div>
                                            <div style={{ fontSize: 12, color: "#475569", flexWrap: "wrap", display: "flex", gap: 6 }}>
                                                <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>{c.id}</span>
                                                <span>{c.category}</span>
                                                <span>· {new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {c.assignedLawyerName && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>⚖️ {c.assignedLawyerName}</div>}
                                        </div>
                                        <StatusBadge status={c.status} />
                                    </div>
                                </div>
                            ))}
                        {allCases.length === 0 && <div className="glass" style={{ padding: 40, textAlign: "center", color: "#475569" }}>No cases in the system yet.</div>}
                    </div>
                )}

                {/* Case Detail */}
                {tab === "case-detail" && selected && (
                    <div className="fadein">
                        <div className="back-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                            <button className="btn-ghost" onClick={() => { setTab("cases"); setSelected(null); }}>← Back</button>
                            <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>CASE · {selected.id}</span>
                            <div style={{ marginLeft: "auto" }}><StatusBadge status={selected.status} /></div>
                        </div>
                        <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
                            <div className="card">
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 12 }}>CASE DETAILS</div>
                                {[["Title", selected.title], ["Category", selected.category], ["Location", selected.location || "—"], ["Incident Date", selected.incidentDate || "—"], ["Filed By", selected.filedByName], ["Opponent", selected.opponentName || "—"], ["Lawyer", selected.assignedLawyerName || "Unassigned"]].map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(124,58,237,.07)", fontSize: 13, gap: 8 }}>
                                        <span style={{ color: "#64748b", flexShrink: 0 }}>{k}</span><span style={{ color: "#94a3b8", textAlign: "right", wordBreak: "break-word" }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="card" style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 10 }}>DESCRIPTION</div>
                                    <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{selected.description}</p>
                                </div>
                                <div className="card">
                                    <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 10 }}>UPDATE STATUS</div>
                                    <select className="inp" onChange={e => {
                                        fetch(`${API}/api/cases/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) })
                                            .then(() => setSelected(p => ({ ...p, status: e.target.value })));
                                    }} value={selected.status}>
                                        {["filed", "lawyer_assigned", "under_review", "hearing_scheduled", "judgement_issued", "closed"].map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Evidence Approval */}
                        {(selected.evidence || []).length > 0 && (
                            <div className="card" style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 14 }}>📋 EVIDENCE — APPROVE / REJECT</div>
                                {selected.evidence.map(ev => (
                                    <div key={ev.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(124,58,237,.07)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 600 }}>📄 {ev.name}</div>
                                                <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontFamily: "monospace", wordBreak: "break-all" }}>{ev.id} · {ev.type}</div>
                                            </div>
                                            <div className="ev-actions" style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                                                <span style={{ color: ev.courtApproval === "approved" ? "#22c55e" : ev.courtApproval === "rejected" ? "#ef4444" : "#f59e0b", fontSize: 12, fontWeight: 700 }}>
                                                    {ev.courtApproval === "approved" ? "✅ Approved" : ev.courtApproval === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                                                </span>
                                                {ev.courtApproval === "pending" && (
                                                    <>
                                                        <button className="btn-g" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => approveEvidence(ev.id, "approved")}>✓ Approve</button>
                                                        <button className="btn-r" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => approveEvidence(ev.id, "rejected")}>✗ Reject</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Hearings */}
                        {(selected.hearings || []).length > 0 && (
                            <div className="card" style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 12 }}>📅 HEARINGS</div>
                                {selected.hearings.map((h, i) => (
                                    <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(124,58,237,.07)", fontSize: 13, flexWrap: "wrap", gap: 8 }}>
                                        <div>
                                            <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{h.hearingDate} at {h.hearingTime}</div>
                                            <div style={{ color: "#475569", fontSize: 12, marginTop: 3 }}>📍 {h.venue}{h.notes && ` · ${h.notes}`}</div>
                                        </div>
                                        <span style={{ padding: "3px 10px", background: "rgba(6,182,212,.12)", border: "1px solid rgba(6,182,212,.25)", borderRadius: 20, fontSize: 11, color: "#06b6d4" }}>Hearing #{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Court Orders */}
                        {(selected.courtOrders || []).length > 0 && (
                            <div className="card">
                                <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 12 }}>📜 COURT ORDERS</div>
                                {selected.courtOrders.map(o => (
                                    <div key={o.id} style={{ padding: "12px", background: "rgba(5,2,18,.7)", borderRadius: 10, marginBottom: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                                            <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>🏛️ {o.judgeName} · {formatDate(o.createdAt)}</span>
                                            <span style={{ color: o.verdict === "acquitted" ? "#22c55e" : o.verdict === "convicted" ? "#ef4444" : "#f59e0b", fontSize: 11, fontWeight: 700 }}>{o.verdict?.toUpperCase()}</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{o.orderText}</p>
                                        <div style={{ fontSize: 10, color: "#334155", marginTop: 8, fontFamily: "monospace", wordBreak: "break-all" }}>HASH: {o.hash}</div>
                                        <div style={{ fontSize: 10, color: "#334155", marginTop: 2, fontFamily: "monospace", wordBreak: "break-all" }}>TX: {o.txHash?.slice(0, 30)}...</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Verify Evidence */}
                {tab === "verify" && <VerifyEvidence />}

                {/* Schedule Hearing */}
                {tab === "hearings" && (
                    <div className="fadein" style={{ maxWidth: 560 }}>
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 20 }}>SCHEDULE COURT HEARING</div>
                        <div className="card">
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                    <div className="lbl">SELECT CASE</div>
                                    <select className="inp" value={hCaseId} onChange={e => setHCaseId(e.target.value)}>
                                        <option value="">— Choose case —</option>
                                        {allCases.filter(c => c.status !== "closed").map(c => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}
                                    </select>
                                </div>
                                <div className="hearing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <div className="lbl">HEARING DATE</div>
                                        <input className="inp" type="date" value={hDate} onChange={e => setHDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                                    </div>
                                    <div>
                                        <div className="lbl">HEARING TIME</div>
                                        <input className="inp" type="time" value={hTime} onChange={e => setHTime(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <div className="lbl">VENUE / COURT ROOM</div>
                                    <input className="inp" placeholder="e.g. Court Hall 3, High Court Building" value={hVenue} onChange={e => setHVenue(e.target.value)} />
                                </div>
                                <div>
                                    <div className="lbl">NOTES / AGENDA</div>
                                    <input className="inp" placeholder="e.g. Arguments on bail application" value={hNotes} onChange={e => setHNotes(e.target.value)} />
                                </div>
                                {schedulingDone && <div style={{ padding: "10px 14px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 8, fontSize: 13, color: "#86efac" }}>✅ Hearing scheduled! Citizens will see this in their dashboard.</div>}
                                <button className="btn-p" onClick={scheduleHearing} disabled={!hCaseId || !hDate}>📅 Schedule Hearing</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Issue Judgement */}
                {tab === "judgements" && (
                    <div className="fadein" style={{ maxWidth: 560 }}>
                        <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 20 }}>ISSUE COURT ORDER / JUDGEMENT</div>
                        <div className="card">
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                    <div className="lbl">SELECT CASE</div>
                                    <select className="inp" value={jCaseId} onChange={e => setJCaseId(e.target.value)}>
                                        <option value="">— Choose case —</option>
                                        {allCases.map(c => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div className="lbl">VERDICT</div>
                                    <select className="inp" value={jVerdict} onChange={e => setJVerdict(e.target.value)}>
                                        <option value="pending">Pending / Interim Order</option>
                                        <option value="acquitted">Acquitted</option>
                                        <option value="convicted">Convicted</option>
                                        <option value="dismissed">Dismissed</option>
                                        <option value="settled">Settled</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <div className="lbl">ORDER / JUDGEMENT TEXT</div>
                                    <textarea className="inp" rows={6} placeholder="Enter the full court order, judgement, or interim direction..." value={jText} onChange={e => setJText(e.target.value)} style={{ resize: "vertical", lineHeight: 1.8 }} />
                                </div>
                                {jDone && (
                                    <div style={{ padding: "12px 14px", background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.25)", borderRadius: 10, fontSize: 13, color: "#c4b5fd" }}>
                                        <div style={{ fontWeight: 700, marginBottom: 6 }}>✅ Judgement Anchored to Blockchain</div>
                                        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#7c3aed", wordBreak: "break-all" }}>Hash: {jDone.hash}</div>
                                        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#475569", marginTop: 2, wordBreak: "break-all" }}>TX: {jDone.txHash?.slice(0, 28)}...</div>
                                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Block #{jDone.blockHeight?.toLocaleString()}</div>
                                    </div>
                                )}
                                <button className="btn-p" onClick={submitJudgement} disabled={!jCaseId || !jText}>📜 Submit &amp; Anchor Judgement →</button>
                                <div style={{ padding: "10px 13px", background: "rgba(124,58,237,.05)", border: "1px solid rgba(124,58,237,.1)", borderRadius: 8, fontSize: 11, color: "#475569", lineHeight: 1.7 }}>
                                    🔒 SHA-256 hash of judgement text will be stored immutably on blockchain. Tamper-proof and timestamped.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function VerifyEvidence() {
    const [input, setInput] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
    async function verify() {
        setLoading(true); setResult(null);
        try {
            const r = await fetch(`${API}/api/evidence/verify/${encodeURIComponent(input)}`);
            setResult(r.ok ? { ok: true, ev: await r.json() } : { ok: false });
        } catch { setResult({ ok: false }); }
        finally { setLoading(false); }
    }
    return (
        <div className="fadein" style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: ".1em", marginBottom: 20 }}>VERIFY EVIDENCE AUTHENTICITY</div>
            <div className="card" style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, letterSpacing: ".08em" }}>ENTER HASH, TX HASH, OR EVIDENCE ID</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input className="inp" placeholder="0x... or EV-2024-001" value={input} onChange={e => { setInput(e.target.value); setResult(null); }} style={{ flex: 1, minWidth: 180 }} />
                    <button className="btn-p" onClick={verify} disabled={loading || !input} style={{ flexShrink: 0 }}>{loading ? "..." : "VERIFY"}</button>
                </div>
            </div>
            {result && (
                <div className="card fadein">
                    {result.ok ? (
                        <div>
                            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                                <div style={{ fontSize: 32 }}>✅</div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: "#22c55e" }}>AUTHENTICITY VERIFIED</div>
                                    <div style={{ fontSize: 12, color: "#475569" }}>Evidence is unmodified — hash matches blockchain record</div>
                                </div>
                            </div>
                            {[["Evidence ID", result.ev.id], ["File", result.ev.name], ["Type", result.ev.type], ["Uploaded By", result.ev.uploadedBy], ["Case", result.ev.caseNo || "—"], ["Block", `#${result.ev.blockHeight?.toLocaleString()}`], ["Court Approval", result.ev.courtApproval?.toUpperCase()]].map(([k, v]) => (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(124,58,237,.07)", fontSize: 13, gap: 8 }}>
                                    <span style={{ color: "#64748b", flexShrink: 0 }}>{k}</span><span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", textAlign: "right" }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: 20 }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#ef4444", marginBottom: 8 }}>NOT FOUND</div>
                            <div style={{ fontSize: 13, color: "#475569" }}>No blockchain record matches this identifier.</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
