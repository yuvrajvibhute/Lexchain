import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSignMessage } from "wagmi";
import { usePrivySafe } from "../context/PrivyContext";
import { savePassword, passwordStrength } from "../utils/passwordUtils";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || "NYAYA2024";
const JUDGE_PASSCODE = "JUDGE2024";

const ROLES = [
    { key: "user", icon: "👤", label: "Citizen", color: "#3b82f6" },
    { key: "lawyer", icon: "⚖️", label: "Lawyer", color: "#d4a017" },
    { key: "judge", icon: "🏛️", label: "Judge", color: "#7c3aed" },
    { key: "admin", icon: "🛡️", label: "Admin", color: "#ef4444" },
];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{min-height:100%;overflow-x:hidden;}
@keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes spin-slow{to{transform:rotate(360deg)}}
@keyframes spin-rev{to{transform:rotate(-360deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 16px rgba(212,160,23,.18)}50%{box-shadow:0 0 40px rgba(212,160,23,.42)}}
@keyframes particle{0%{transform:translateY(100vh);opacity:0}50%{opacity:.5}100%{transform:translateY(-5vh);opacity:0}}
@keyframes pwfill{from{width:0}to{width:100%}}
.panel{animation:scaleIn .5s cubic-bezier(.34,1.56,.64,1) both;}
.inp{width:100%;padding:11px 14px;background:rgba(10,22,40,.9);border:1px solid rgba(212,160,23,.2);border-radius:9px;color:#e2e8f0;font-size:13px;font-family:inherit;outline:none;transition:all .2s;}
.inp:focus{border-color:#d4a017;box-shadow:0 0 0 3px rgba(212,160,23,.1);}
.inp:disabled{opacity:.45;cursor:not-allowed;}
.inp::placeholder{color:#475569;}
.inp option{background:#0a1628;}
.lbl{font-size:10px;color:#94a3b8;letter-spacing:.1em;font-weight:600;margin-bottom:5px;}
.req{color:#ef4444;margin-left:2px;}
.fld{display:flex;flex-direction:column;gap:5px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.btn-submit{width:100%;padding:13px;background:linear-gradient(135deg,#d4a017,#b8860b);border:none;border-radius:9px;color:#020818;cursor:pointer;font-family:inherit;font-size:14px;font-weight:800;transition:all .2s;animation:glow 3s ease-in-out infinite;}
.btn-submit:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1);}
.btn-submit:disabled{background:#1e3a6e;color:#475569;animation:none;cursor:not-allowed;transform:none;}
.wallet-btn{width:100%;padding:12px;background:rgba(37,99,235,.12);border:1px solid rgba(96,165,250,.3);border-radius:9px;color:#93c5fd;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s;}
.wallet-btn:hover{background:rgba(37,99,235,.22);transform:translateY(-1px);}
.err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:9px 13px;font-size:13px;color:#fca5a5;display:flex;gap:8px;}
.tab{flex:1;padding:9px;background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;color:#64748b;transition:all .2s;position:relative;}
.tab.on{color:#d4a017;}
.tab.on::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:2px;background:#d4a017;border-radius:2px;}
.ptcl{position:fixed;border-radius:50%;pointer-events:none;animation:particle linear infinite;}
.pw-wrap{position:relative;}
.pw-wrap .inp{padding-right:42px;}
.pw-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748b;font-size:16px;line-height:1;}
.pw-bar{height:3px;border-radius:2px;margin-top:5px;background:#1e3a6e;overflow:hidden;}
.pw-bar-fill{height:100%;border-radius:2px;transition:width .4s,background .4s;}
@media(max-width:860px){.split{flex-direction:column!important;}.left-panel{display:none!important;}.right-panel{padding:28px 16px!important;}}
@media(max-width:480px){.grid2{grid-template-columns:1fr!important;}.right-panel{padding:20px 12px!important;}}
`;

const ROLE_FIELDS = {
    user: [
        { key: "name", label: "FULL NAME", ph: "e.g. Priya Sharma", req: true },
        { key: "email", label: "GMAIL / EMAIL", ph: "name@gmail.com", req: true, type: "email" },
        { key: "phone", label: "MOBILE NUMBER", ph: "9876543210", req: true },
        { key: "aadhaar", label: "AADHAAR / NATIONAL ID", ph: "XXXX-XXXX-XXXX", req: true },
        { key: "city", label: "CITY", ph: "e.g. Bangalore, Mumbai", req: true },
        { key: "fullAddress", label: "FULL ADDRESS", ph: "Street, Area, Pincode", req: false },
    ],
    lawyer: [
        { key: "name", label: "FULL NAME", ph: "Adv. Priya Krishnamurthy", req: true },
        { key: "email", label: "EMAIL ADDRESS", ph: "lawyer@email.com", req: true, type: "email" },
        { key: "barCouncilId", label: "BAR COUNCIL ID", ph: "KAR/2015/3421", req: true },
        { key: "licenseNo", label: "LICENSE NUMBER", ph: "LIC-KA-3421", req: true },
        { key: "specialization", label: "SPECIALIZATION", ph: "", req: true, select: ["Criminal Law", "Civil Law", "Family Law", "Constitutional Law", "Cyber Law", "Corporate Law", "Property Law", "Human Rights", "Tax Law", "Labor Law"] },
        { key: "experience", label: "EXPERIENCE (YEARS)", ph: "e.g. 8", req: true, type: "number" },
        { key: "fee", label: "CONSULTATION FEE (₹)", ph: "e.g. 5000", req: false, type: "number" },
        { key: "courtName", label: "COURT / BAR ASSOCIATION", ph: "e.g. Karnataka High Court", req: true },
        { key: "city", label: "CITY", ph: "e.g. Bangalore", req: true },
        { key: "phone", label: "CONTACT NUMBER", ph: "9876543210", req: true },
    ],
    judge: [
        { key: "name", label: "FULL NAME / TITLE", ph: "Hon. Justice Meena Iyer", req: true },
        { key: "email", label: "OFFICIAL EMAIL", ph: "judge@court.gov.in", req: true, type: "email" },
        { key: "courtName", label: "COURT NAME", ph: "Karnataka High Court", req: true },
        { key: "post", label: "DESIGNATION", ph: "e.g. Additional Sessions Judge", req: true },
        { key: "city", label: "CITY", ph: "e.g. Bangalore", req: true },
        { key: "passcode", label: "JUDGE PASSCODE", ph: "Provide official passcode", req: true, type: "password", special: "passcode" },
    ],
    admin: [
        { key: "name", label: "FULL NAME", ph: "Admin Name", req: true },
        { key: "email", label: "EMAIL ADDRESS", ph: "admin@lexchain.in", req: true, type: "email" },
        { key: "post", label: "POST / DESIGNATION", ph: "e.g. System Administrator", req: true },
        { key: "passcode", label: "ADMIN PASSCODE", ph: "Enter admin passcode", req: true, type: "password", special: "passcode" },
    ],
};

function roleRedirect(role) {
    if (role === "admin") return "/admin";
    if (role === "lawyer") return "/lawyer";
    if (role === "judge") return "/court";
    return "/dashboard";
}

export default function Register() {
    const navigate = useNavigate();
    const { login: handleAuthLogin } = useAuth();
    const { login, authenticated, user, logout } = usePrivySafe();
    const { signMessageAsync } = useSignMessage();

    const [role, setRole] = useState("user");
    const [fields, setFields] = useState({});
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [moved, setMoved] = useState({ x: .5, y: .5 });

    // Password state
    const [password, setPassword] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [success, setSuccess] = useState("");

    const address = user?.wallet?.address;
    const pwStrength = passwordStrength(password);
    const pwBarWidth = `${(pwStrength.score / 4) * 100}%`;

    useEffect(() => {
        setFields({});
        setErr("");
    }, [role]);

    useEffect(() => {
        const h = e => setMoved({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
        window.addEventListener("mousemove", h, { passive: true });
        return () => window.removeEventListener("mousemove", h);
    }, []);

    function validate() {
        if (!authenticated || !address) { setErr("Connect your wallet first."); return false; }

        // Password validation
        if (!password) { setErr("Password is required."); return false; }
        if (password.length < 8) { setErr("Password must be at least 8 characters."); return false; }
        if (password !== confirmPw) { setErr("Passwords do not match."); return false; }

        const defs = ROLE_FIELDS[role];
        for (const f of defs) {
            if (f.req && !fields[f.key]?.toString().trim()) {
                setErr(`${f.label.replace(/\(.*\)/, "").trim()} is required.`);
                return false;
            }
        }
        if (role === "admin" && fields.passcode !== ADMIN_PASSCODE) { setErr("Invalid admin passcode."); return false; }
        if (role === "judge" && fields.passcode !== JUDGE_PASSCODE) { setErr("Invalid judge passcode."); return false; }
        return true;
    }

    async function handleRegister() {
        setErr(""); setSuccess("");
        if (!validate()) return;
        setLoading(true);
        try {
            // Save password hash locally (works without backend)
            await savePassword(address, password);

            // Try backend registration
            try {
                const message = `Register with LexChain\nRole: ${role}\nAddress: ${address}\nTimestamp: ${Date.now()}`;
                const signature = await signMessageAsync({ message });
                const body = { address, signature, message, role, ...fields };
                const res = await fetch(`${API}/api/auth/wallet`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
                });
                if (res.ok) {
                    const data = await res.json();
                    handleAuthLogin({ ...data.user, token: data.token });
                    navigate(roleRedirect(data.user.role));
                    return;
                }
            } catch (_) {
                // Backend unavailable — fall back to local registration
            }

            // Local-only registration fallback
            const userData = {
                address,
                role,
                name: fields.name || "User",
                email: fields.email || "",
                ...fields,
                registeredAt: Date.now(),
            };
            handleAuthLogin(userData);
            setSuccess("✅ Registration successful!");
            setTimeout(() => navigate(roleRedirect(role)), 800);

        } catch (e) { setErr(e.message || "Registration failed. Please try again."); }
        finally { setLoading(false); }
    }

    const fDefs = ROLE_FIELDS[role];
    const tiltX = (moved.y - .5) * 4;
    const tiltY = (moved.x - .5) * -4;

    return (
        <div style={{ minHeight: "100vh", background: "#020818", display: "flex", fontFamily: "'Inter',sans-serif", overflow: "hidden", position: "relative" }}>
            <style>{STYLES}</style>
            {[{ s: 4, l: "12%", d: "9s", del: "0s", c: "rgba(212,160,23,.5)" }, { s: 5, l: "70%", d: "13s", del: "3s", c: "rgba(37,99,235,.4)" }, { s: 3, l: "45%", d: "10s", del: "6s", c: "rgba(212,160,23,.35)" }].map((p, i) =>
                <div key={i} className="ptcl" style={{ width: p.s, height: p.s, left: p.l, bottom: 0, background: p.c, animationDuration: p.d, animationDelay: p.del }} />
            )}

            <div className="split" style={{ display: "flex", flex: 1 }}>
                {/* Left panel */}
                <div className="left-panel" style={{ flex: "0 0 38%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative", overflow: "hidden", background: "linear-gradient(145deg,#020818,#0a1628 60%,#020818)", borderRight: "1px solid rgba(212,160,23,.1)" }}>
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,160,23,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(212,160,23,.03) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,160,23,.07) 0%,transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 300, height: 300, border: "1px solid rgba(212,160,23,.1)", borderRadius: "50%", animation: "spin-slow 28s linear infinite" }} />
                    <div style={{ position: "absolute", width: 220, height: 220, border: "1px solid rgba(37,99,235,.08)", borderRadius: "50%", animation: "spin-rev 18s linear infinite" }} />
                    <div style={{ animation: "float 5s ease-in-out infinite", zIndex: 1, marginBottom: 28 }}>
                        <svg width="140" height="140" viewBox="0 0 200 200" fill="none">
                            <rect x="97" y="42" width="7" height="120" fill="url(#rg1)" rx="3" />
                            <circle cx="100" cy="38" r="13" fill="url(#rg2)" />
                            <rect x="28" y="76" width="144" height="7" fill="url(#rg3)" rx="3" />
                            <line x1="50" y1="83" x2="38" y2="140" stroke="#d4a017" strokeWidth="2" strokeDasharray="4 3" />
                            <line x1="150" y1="83" x2="163" y2="140" stroke="#d4a017" strokeWidth="2" strokeDasharray="4 3" />
                            <ellipse cx="38" cy="144" rx="24" ry="7" stroke="#d4a017" strokeWidth="2" fill="rgba(212,160,23,.07)" />
                            <ellipse cx="163" cy="144" rx="24" ry="7" stroke="#d4a017" strokeWidth="2" fill="rgba(212,160,23,.07)" />
                            <defs>
                                <linearGradient id="rg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#b8860b" /><stop offset="50%" stopColor="#f0c040" /><stop offset="100%" stopColor="#b8860b" /></linearGradient>
                                <linearGradient id="rg3" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#d4a017" stopOpacity=".3" /><stop offset="50%" stopColor="#f0c040" /><stop offset="100%" stopColor="#d4a017" stopOpacity=".3" /></linearGradient>
                                <radialGradient id="rg2"><stop offset="0%" stopColor="#f0c040" /><stop offset="100%" stopColor="#b8860b" /></radialGradient>
                            </defs>
                        </svg>
                    </div>
                    <div style={{ textAlign: "center", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 16 }}>
                            <img src="/logo.jpg" alt="LexChain" style={{ height: 32, borderRadius: 7 }} />
                            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg,#f0c040,#d4a017)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LEXCHAIN</span>
                        </div>
                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(18px,2.2vw,24px)", fontWeight: 800, background: "linear-gradient(135deg,#f0c040,#d4a017)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>India's Premier Blockchain<br />Legal Evidence Platform</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
                            {ROLES.map(r => (
                                <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "rgba(212,160,23,.04)", border: "1px solid rgba(212,160,23,.1)", borderRadius: 9, textAlign: "left" }}>
                                    <span style={{ fontSize: 15 }}>{r.icon}</span>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</div>
                                        <div style={{ fontSize: 10, color: "#475569" }}>{r.key === "user" ? "Submit cases & evidence" : r.key === "lawyer" ? "Represent clients in court" : r.key === "judge" ? "Preside & issue judgements" : "Manage platform & users"}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="right-panel" style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 40px", overflowY: "auto" }}>
                    <div className="panel" style={{ width: "100%", maxWidth: 500, transform: `perspective(900px) rotateX(${tiltX * .2}deg) rotateY(${tiltY * .2}deg)`, transition: "transform .1s ease" }}>
                        <button onClick={() => navigate("/")} style={{ background: "rgba(10,22,40,.7)", border: "1px solid rgba(212,160,23,.2)", borderRadius: 7, padding: "7px 14px", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontFamily: "inherit", marginBottom: 22 }}>← Home</button>
                        <div style={{ marginBottom: 18 }}>
                            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Create Account</h1>
                            <p style={{ fontSize: 13, color: "#64748b" }}>Connect your wallet, set a password and fill in your details</p>
                        </div>

                        <div style={{ display: "flex", background: "rgba(10,22,40,.6)", border: "1px solid rgba(212,160,23,.13)", borderRadius: 10, padding: 3, marginBottom: 20 }}>
                            <button className="tab" onClick={() => navigate("/login")}>Sign In</button>
                            <button className="tab on">Register</button>
                        </div>

                        <div style={{ background: "rgba(10,22,40,.8)", backdropFilter: "blur(20px)", border: "1px solid rgba(212,160,23,.13)", borderRadius: 18, padding: "24px", boxShadow: "0 20px 56px rgba(0,0,0,.5),inset 0 1px 0 rgba(212,160,23,.08)" }}>

                            {/* Role selector */}
                            <div style={{ marginBottom: 18 }}>
                                <div className="lbl">SELECT YOUR ROLE</div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
                                    {ROLES.map(r => (
                                        <button key={r.key} onClick={() => setRole(r.key)} style={{ cursor: "pointer", padding: "9px 6px", borderRadius: 9, border: `2px solid ${role === r.key ? r.color : "rgba(212,160,23,.1)"}`, background: role === r.key ? r.color + "22" : "transparent", color: role === r.key ? r.color : "#64748b", fontFamily: "inherit", fontSize: 11, fontWeight: 700, textAlign: "center", transition: "all .2s" }}>
                                            <div style={{ fontSize: 18, marginBottom: 3 }}>{r.icon}</div>
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 1: Connect wallet */}
                            <div style={{ marginBottom: 18 }}>
                                <div className="lbl">STEP 1 — CONNECT WALLET <span className="req">*</span></div>
                                {!authenticated ? (
                                    <button onClick={login} className="wallet-btn"><span style={{ fontSize: 18 }}>🔗</span> Connect Wallet</button>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.27)", borderRadius: 9, fontSize: 13 }}>
                                        <span>✅</span>
                                        <span style={{ color: "#86efac", fontFamily: "monospace", flex: 1, fontSize: 12 }}>
                                            {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Connected"}
                                        </span>
                                        <button onClick={logout} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 10 }}>Logout</button>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Set password */}
                            <div style={{ marginBottom: 18 }}>
                                <div className="lbl">STEP 2 — SET YOUR PASSWORD <span className="req">*</span></div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {/* Password */}
                                    <div className="fld">
                                        <label className="lbl" style={{ fontSize: 9 }}>PASSWORD <span className="req">*</span></label>
                                        <div className="pw-wrap">
                                            <input
                                                className="inp"
                                                type={showPw ? "text" : "password"}
                                                placeholder="Min. 8 characters"
                                                value={password}
                                                onChange={e => { setPassword(e.target.value); setErr(""); }}
                                                disabled={!authenticated}
                                            />
                                            <button className="pw-eye" type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                                                {showPw ? "🙈" : "👁️"}
                                            </button>
                                        </div>
                                        {password && (
                                            <div>
                                                <div className="pw-bar">
                                                    <div className="pw-bar-fill" style={{ width: pwBarWidth, background: pwStrength.color }} />
                                                </div>
                                                <div style={{ fontSize: 10, color: pwStrength.color, marginTop: 3 }}>{pwStrength.label}</div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Confirm password */}
                                    <div className="fld">
                                        <label className="lbl" style={{ fontSize: 9 }}>CONFIRM PASSWORD <span className="req">*</span></label>
                                        <div className="pw-wrap">
                                            <input
                                                className="inp"
                                                type={showConfirm ? "text" : "password"}
                                                placeholder="Repeat your password"
                                                value={confirmPw}
                                                onChange={e => { setConfirmPw(e.target.value); setErr(""); }}
                                                disabled={!authenticated}
                                            />
                                            <button className="pw-eye" type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                                                {showConfirm ? "🙈" : "👁️"}
                                            </button>
                                        </div>
                                        {confirmPw && password && (
                                            <div style={{ fontSize: 10, marginTop: 3, color: confirmPw === password ? "#22c55e" : "#ef4444" }}>
                                                {confirmPw === password ? "✓ Passwords match" : "✗ Passwords do not match"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Fill details */}
                            <div style={{ marginBottom: 4 }}>
                                <div className="lbl">STEP 3 — FILL YOUR DETAILS</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                                    {fDefs.map(f => (
                                        <div key={f.key} className="fld">
                                            <label className="lbl" style={{ fontSize: 9 }}>{f.label}{f.req && <span className="req"> *</span>}</label>
                                            {f.select ? (
                                                <select className="inp" value={fields[f.key] || ""} onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))} disabled={!authenticated}>
                                                    <option value="">— Select —</option>
                                                    {f.select.map(o => <option key={o}>{o}</option>)}
                                                </select>
                                            ) : (
                                                <input className="inp" type={f.type || "text"} placeholder={f.ph}
                                                    value={fields[f.key] || ""} onChange={e => { setFields(p => ({ ...p, [f.key]: e.target.value })); setErr(""); }}
                                                    disabled={!authenticated} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {err && <div className="err" style={{ marginTop: 14 }}><span>⚠</span><span>{err}</span></div>}
                            {success && <div style={{ marginTop: 14, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#86efac" }}>{success}</div>}

                            <button className="btn-submit" style={{ marginTop: 18 }} onClick={handleRegister} disabled={loading || !authenticated}>
                                {!authenticated ? "🔒 Connect Wallet First" : loading ? "Creating account..." : `✅ Register as ${ROLES.find(r => r.key === role)?.label} →`}
                            </button>

                            <div style={{ marginTop: 14, padding: "10px 13px", background: "rgba(212,160,23,.04)", border: "1px solid rgba(212,160,23,.1)", borderRadius: 7, fontSize: 11, color: "#475569", lineHeight: 1.7 }}>
                                🔒 Secure wallet connection via MetaMask, Rainbow, Coinbase & more.
                            </div>
                        </div>

                        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#64748b" }}>
                            Already registered?{" "}
                            <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "#d4a017", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>Sign In →</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
