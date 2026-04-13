import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSignMessage } from "wagmi";
import { usePrivySafe } from "../context/PrivyContext";
import { savePassword, passwordStrength } from "../utils/passwordUtils";
import { useTheme } from "../context/ThemeContext";

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
html,body{min-height:100%;overflow-x:hidden;}
@keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes spin-slow{to{transform:rotate(360deg)}}
@keyframes spin-rev{to{transform:rotate(-360deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 16px rgba(212,160,23,.18)}50%{box-shadow:0 0 40px rgba(212,160,23,.42)}}
@keyframes particle{0%{transform:translateY(100vh);opacity:0}50%{opacity:.5}100%{transform:translateY(-5vh);opacity:0}}

.reg-page{min-height:100vh;background:var(--bg-page);color:var(--text-primary);display:flex;font-family:'Inter',sans-serif;overflow:hidden;position:relative;transition:background .3s,color .3s;}
.reg-panel{animation:scaleIn .5s cubic-bezier(.34,1.56,.64,1) both;}

.rinp{width:100%;padding:11px 14px;background:var(--bg-input);border:1px solid var(--border-gold);border-radius:9px;color:var(--text-primary);font-size:13px;font-family:inherit;outline:none;transition:all .2s;}
.rinp:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,160,23,.12);}
.rinp:disabled{opacity:.45;cursor:not-allowed;}
.rinp::placeholder{color:var(--text-faint);}
.rinp option{background:var(--bg-panel);}
.rlbl{font-size:10px;color:var(--text-muted);letter-spacing:.1em;font-weight:600;margin-bottom:5px;}
.req{color:#ef4444;margin-left:2px;}
.rfld{display:flex;flex-direction:column;gap:5px;}

.btn-submit{width:100%;padding:13px;background:linear-gradient(135deg,var(--gold),var(--gold-d));border:none;border-radius:9px;color:#020818;cursor:pointer;font-family:inherit;font-size:14px;font-weight:800;transition:all .2s;animation:glow 3s ease-in-out infinite;}
.btn-submit:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1);}
.btn-submit:disabled{background:var(--bg-panel);color:var(--text-faint);animation:none;cursor:not-allowed;transform:none;}

.wallet-btn{width:100%;padding:12px;background:rgba(37,99,235,.1);border:1px solid rgba(96,165,250,.3);border-radius:9px;color:#93c5fd;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s;}
.wallet-btn:hover{background:rgba(37,99,235,.2);transform:translateY(-1px);}

.err-box{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:9px 13px;font-size:13px;color:#fca5a5;display:flex;gap:8px;}
.ok-box{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:9px 13px;font-size:13px;color:#86efac;}

.rtab{flex:1;padding:9px;background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;color:var(--text-faint);transition:all .2s;position:relative;}
.rtab.on{color:var(--gold);}
.rtab.on::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:2px;background:var(--gold);border-radius:2px;}

.ptcl{position:fixed;border-radius:50%;pointer-events:none;animation:particle linear infinite;}
.pw-wrap{position:relative;}
.pw-wrap .rinp{padding-right:42px;}
.pw-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-faint);font-size:16px;line-height:1;}
.pw-bar{height:3px;border-radius:2px;margin-top:5px;background:var(--bg-panel);overflow:hidden;}
.pw-bar-fill{height:100%;border-radius:2px;transition:width .4s,background .4s;}

/* Left panel */
.reg-left{flex:0 0 38%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 40px;position:relative;overflow:hidden;border-right:1px solid var(--border-card);}
[data-theme="dark"] .reg-left{background:linear-gradient(145deg,#020818,#0a1628 60%,#020818);}
[data-theme="light"] .reg-left{background:linear-gradient(145deg,#eae6dd,#f4f1ea 60%,#eae6dd);}

/* Right panel */
.reg-right{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:32px 40px;overflow-y:auto;}

/* Card */
.reg-card{background:var(--bg-card2);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:18px;padding:24px;box-shadow:0 20px 56px rgba(0,0,0,.2),inset 0 1px 0 var(--border-card);}

.role-btn{cursor:pointer;border-radius:9px;font-family:inherit;font-size:11px;font-weight:700;text-align:center;transition:all .2s;padding:9px 6px;}

/* Theme toggle */
.reg-theme-btn{position:fixed;top:16px;right:16px;z-index:200;width:38px;height:38px;border-radius:50%;border:1px solid var(--border-gold);background:var(--bg-card);color:var(--gold);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;transition:all .25s;}
.reg-theme-btn:hover{transform:rotate(20deg) scale(1.1);border-color:var(--gold);}

@media(max-width:820px){
  .reg-split{flex-direction:column!important;}
  .reg-left{display:none!important;}
  .reg-right{padding:28px 16px!important;align-items:flex-start!important;}
}
@media(max-width:480px){
  .reg-right{padding:20px 12px!important;}
  .reg-card{padding:18px 14px!important;border-radius:14px!important;}
}
`;

const ROLE_FIELDS = {
    user: [
        { key: "name", label: "FULL NAME", ph: "e.g. Priya Sharma", req: true },
        { key: "phone", label: "MOBILE NUMBER", ph: "9876543210", req: true },
        { key: "aadhaar", label: "AADHAAR / NATIONAL ID", ph: "XXXX-XXXX-XXXX", req: true },
        { key: "city", label: "CITY", ph: "e.g. Bangalore, Mumbai", req: true },
        { key: "fullAddress", label: "FULL ADDRESS", ph: "Street, Area, Pincode", req: false },
    ],
    lawyer: [
        { key: "name", label: "FULL NAME", ph: "Adv. Priya Krishnamurthy", req: true },
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
        { key: "courtName", label: "COURT NAME", ph: "Karnataka High Court", req: true },
        { key: "post", label: "DESIGNATION", ph: "e.g. Additional Sessions Judge", req: true },
        { key: "city", label: "CITY", ph: "e.g. Bangalore", req: true },
        { key: "passcode", label: "JUDGE PASSCODE", ph: "Provide official passcode", req: true, type: "password", special: "passcode" },
    ],
    admin: [
        { key: "name", label: "FULL NAME", ph: "Admin Name", req: true },
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
    const { isDark, toggleTheme } = useTheme();

    const [role, setRole] = useState("user");
    const [fields, setFields] = useState({});
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const address = user?.wallet?.address;
    const pwStrength = passwordStrength(password);
    const pwBarWidth = `${(pwStrength.score / 4) * 100}%`;

    useEffect(() => { setFields({}); setErr(""); }, [role]);

    function validate() {
        if (!authenticated || !address) { setErr("Connect your wallet first."); return false; }
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
            await savePassword(address, password);
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
            } catch (_) { /* fall back */ }
            const userData = { address, role, name: fields.name || "User", ...fields, registeredAt: Date.now() };
            handleAuthLogin(userData);
            setSuccess("✅ Registration successful!");
            setTimeout(() => navigate(roleRedirect(role)), 800);
        } catch (e) { setErr(e.message || "Registration failed. Please try again."); }
        finally { setLoading(false); }
    }

    const fDefs = ROLE_FIELDS[role];

    return (
        <div className="reg-page">
            <style>{STYLES}</style>

            {isDark && [
                { s: 4, l: "12%", d: "9s", del: "0s", c: "rgba(212,160,23,.5)" },
                { s: 5, l: "70%", d: "13s", del: "3s", c: "rgba(37,99,235,.4)" },
                { s: 3, l: "45%", d: "10s", del: "6s", c: "rgba(212,160,23,.35)" }
            ].map((p, i) =>
                <div key={i} className="ptcl" style={{ width: p.s, height: p.s, left: p.l, bottom: 0, background: p.c, animationDuration: p.d, animationDelay: p.del }} />
            )}

            {/* Theme toggle */}
            <button className="reg-theme-btn" onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"}>
                {isDark ? "☀️" : "🌙"}
            </button>

            <div className="reg-split" style={{ display: "flex", flex: 1 }}>
                {/* Left panel */}
                <div className="reg-left">
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--border-card) 1px,transparent 1px),linear-gradient(90deg,var(--border-card) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,160,23,.07) 0%,transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 300, height: 300, border: "1px solid rgba(212,160,23,.1)", borderRadius: "50%", animation: "spin-slow 28s linear infinite" }} />
                    <div style={{ position: "absolute", width: 220, height: 220, border: "1px solid rgba(37,99,235,.08)", borderRadius: "50%", animation: "spin-rev 18s linear infinite" }} />
                    <div style={{ animation: "float 5s ease-in-out infinite", zIndex: 1, marginBottom: 24 }}>
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
                        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 14 }}>
                            <img src="/logo.jpg" alt="LexChain" style={{ height: 30, borderRadius: 6 }} />
                            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 800, background: "linear-gradient(135deg,var(--gold-l),var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LEXCHAIN</span>
                        </div>
                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(16px,2vw,22px)", fontWeight: 800, background: "linear-gradient(135deg,var(--gold-l),var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 14 }}>India's Premier Blockchain<br />Legal Evidence Platform</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {ROLES.map(r => (
                                <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "rgba(212,160,23,.04)", border: "1px solid var(--border-card)", borderRadius: 9, textAlign: "left" }}>
                                    <span style={{ fontSize: 15 }}>{r.icon}</span>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</div>
                                        <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{r.key === "user" ? "Submit cases & evidence" : r.key === "lawyer" ? "Represent clients in court" : r.key === "judge" ? "Preside & issue judgements" : "Manage platform & users"}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="reg-right">
                    <div className="reg-panel" style={{ width: "100%", maxWidth: 500 }}>
                        <button onClick={() => navigate("/")} style={{ background: "var(--bg-card)", border: "1px solid var(--border-gold)", borderRadius: 7, padding: "7px 14px", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", marginBottom: 20 }}>← Home</button>

                        <div style={{ marginBottom: 16 }}>
                            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Create Account</h1>
                            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Connect your wallet, set a password and fill in your details</p>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: 10, padding: 3, marginBottom: 18 }}>
                            <button className="rtab" onClick={() => navigate("/login")}>Sign In</button>
                            <button className="rtab on">Register</button>
                        </div>

                        <div className="reg-card">
                            {/* Role selector */}
                            <div style={{ marginBottom: 16 }}>
                                <div className="rlbl">SELECT YOUR ROLE</div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                                    {ROLES.map(r => (
                                        <button
                                            key={r.key}
                                            className="role-btn"
                                            onClick={() => setRole(r.key)}
                                            style={{
                                                border: `2px solid ${role === r.key ? r.color : "var(--border-card)"}`,
                                                background: role === r.key ? r.color + "22" : "transparent",
                                                color: role === r.key ? r.color : "var(--text-faint)",
                                            }}
                                        >
                                            <div style={{ fontSize: 18, marginBottom: 3 }}>{r.icon}</div>
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 1: Wallet */}
                            <div style={{ marginBottom: 16 }}>
                                <div className="rlbl">STEP 1 — CONNECT WALLET <span className="req">*</span></div>
                                {!authenticated ? (
                                    <button onClick={login} className="wallet-btn"><span style={{ fontSize: 18 }}>🔗</span> Connect Wallet</button>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.27)", borderRadius: 9, fontSize: 13 }}>
                                        <span>✅</span>
                                        <span style={{ color: "#86efac", fontFamily: "monospace", flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Connected"}
                                        </span>
                                        <button onClick={logout} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 10, whiteSpace: "nowrap" }}>Disconnect</button>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Password */}
                            <div style={{ marginBottom: 16 }}>
                                <div className="rlbl">STEP 2 — SET YOUR PASSWORD <span className="req">*</span></div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <div className="rfld">
                                        <label className="rlbl" style={{ fontSize: 9 }}>PASSWORD <span className="req">*</span></label>
                                        <div className="pw-wrap">
                                            <input className="rinp" type={showPw ? "text" : "password"} placeholder="Min. 8 characters" value={password}
                                                onChange={e => { setPassword(e.target.value); setErr(""); }} disabled={!authenticated} />
                                            <button className="pw-eye" type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                                                {showPw ? "🙈" : "👁️"}
                                            </button>
                                        </div>
                                        {password && (
                                            <div>
                                                <div className="pw-bar"><div className="pw-bar-fill" style={{ width: pwBarWidth, background: pwStrength.color }} /></div>
                                                <div style={{ fontSize: 10, color: pwStrength.color, marginTop: 3 }}>{pwStrength.label}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="rfld">
                                        <label className="rlbl" style={{ fontSize: 9 }}>CONFIRM PASSWORD <span className="req">*</span></label>
                                        <div className="pw-wrap">
                                            <input className="rinp" type={showConfirm ? "text" : "password"} placeholder="Repeat your password" value={confirmPw}
                                                onChange={e => { setConfirmPw(e.target.value); setErr(""); }} disabled={!authenticated} />
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

                            {/* Step 3: Details */}
                            <div style={{ marginBottom: 4 }}>
                                <div className="rlbl">STEP 3 — FILL YOUR DETAILS</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 8 }}>
                                    {fDefs.map(f => (
                                        <div key={f.key} className="rfld">
                                            <label className="rlbl" style={{ fontSize: 9 }}>{f.label}{f.req && <span className="req"> *</span>}</label>
                                            {f.select ? (
                                                <select className="rinp" value={fields[f.key] || ""} onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))} disabled={!authenticated}>
                                                    <option value="">— Select —</option>
                                                    {f.select.map(o => <option key={o}>{o}</option>)}
                                                </select>
                                            ) : (
                                                <input className="rinp" type={f.type || "text"} placeholder={f.ph}
                                                    value={fields[f.key] || ""} onChange={e => { setFields(p => ({ ...p, [f.key]: e.target.value })); setErr(""); }}
                                                    disabled={!authenticated} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {err && <div className="err-box" style={{ marginTop: 14 }}><span>⚠</span><span>{err}</span></div>}
                            {success && <div className="ok-box" style={{ marginTop: 14 }}>{success}</div>}

                            <button className="btn-submit" style={{ marginTop: 16 }} onClick={handleRegister} disabled={loading || !authenticated}>
                                {!authenticated ? "🔒 Connect Wallet First" : loading ? "Creating account..." : `✅ Register as ${ROLES.find(r => r.key === role)?.label} →`}
                            </button>

                            <div style={{ marginTop: 12, padding: "9px 12px", background: "rgba(212,160,23,.04)", border: "1px solid var(--border-card)", borderRadius: 7, fontSize: 11, color: "var(--text-faint)", lineHeight: 1.7 }}>
                                🔒 Secure wallet connection via MetaMask, Rainbow, Coinbase & more.
                            </div>
                        </div>

                        <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--text-faint)" }}>
                            Already registered?{" "}
                            <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>Sign In →</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
