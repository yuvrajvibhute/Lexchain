import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSignMessage } from "wagmi";
import { usePrivySafe } from "../context/PrivyContext";
import { verifyPassword, hasPassword } from "../utils/passwordUtils";
import { useTheme } from "../context/ThemeContext";

const API = import.meta.env.VITE_API_URL || "/api";
const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || "NYAYA2024";
const JUDGE_PASSCODE = "JUDGE2024";

const ROLES = [
    { key: "user", icon: "👤", label: "Citizen", color: "#3b82f6" },
    { key: "lawyer", icon: "⚖️", label: "Lawyer", color: "#d4a017" },
    { key: "judge", icon: "🏛️", label: "Judge", color: "#7c3aed" },
    { key: "admin", icon: "🛡️", label: "Admin", color: "#ef4444" },
];

const QUOTES = [
    { text: "\"Fiat justitia ruat caelum\" — Let justice be done though the heavens fall.", attr: "Latin Legal Maxim" },
    { text: "\"Justice delayed is justice denied.\"", attr: "— W.E. Gladstone" },
    { text: "\"The law is reason, free from passion.\"", attr: "— Aristotle" },
    { text: "\"Equal Justice Under Law\"", attr: "— US Supreme Court Motto" },
];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
@keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes spin-slow{to{transform:rotate(360deg)}}
@keyframes spin-rev{to{transform:rotate(-360deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 16px rgba(212,160,23,.18)}50%{box-shadow:0 0 40px rgba(212,160,23,.42)}}
@keyframes quote-fade{0%{opacity:0;transform:translateY(8px)}15%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
@keyframes particle{0%{transform:translateY(100vh);opacity:0}50%{opacity:.5}100%{transform:translateY(-5vh);opacity:0}}

.login-page{min-height:100vh;background:var(--bg-page);color:var(--text-primary);display:flex;font-family:'Inter',sans-serif;overflow:hidden;position:relative;transition:background .3s,color .3s;}
.login-panel{animation:scaleIn .5s cubic-bezier(.34,1.56,.64,1) both;}

.inp{width:100%;padding:11px 14px;background:var(--bg-input);border:1px solid var(--border-gold);border-radius:9px;color:var(--text-primary);font-size:13px;font-family:inherit;outline:none;transition:all .2s;}
.inp:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,160,23,.12);}
.inp:disabled{opacity:.45;cursor:not-allowed;}
.inp::placeholder{color:var(--text-faint);}
.lbl{font-size:10px;color:var(--text-muted);letter-spacing:.1em;font-weight:600;margin-bottom:5px;}
.req{color:#ef4444;margin-left:2px;}
.fld{display:flex;flex-direction:column;gap:5px;}

.btn-submit{width:100%;padding:13px;background:linear-gradient(135deg,var(--gold),var(--gold-d));border:none;border-radius:9px;color:#020818;cursor:pointer;font-family:inherit;font-size:14px;font-weight:800;transition:all .2s;animation:glow 3s ease-in-out infinite;}
.btn-submit:hover:not(:disabled){transform:translateY(-2px);}
.btn-submit:disabled{background:var(--bg-panel);color:var(--text-faint);animation:none;cursor:not-allowed;}

.wallet-btn{width:100%;padding:12px;background:rgba(37,99,235,.1);border:1px solid rgba(96,165,250,.3);border-radius:9px;color:#93c5fd;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s;}
.wallet-btn:hover{background:rgba(37,99,235,.2);transform:translateY(-1px);}

.err-box{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:9px 13px;font-size:13px;color:#fca5a5;display:flex;gap:8px;}

.ltab{flex:1;padding:9px;background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;color:var(--text-faint);transition:all .2s;position:relative;}
.ltab.on{color:var(--gold);}
.ltab.on::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:2px;background:var(--gold);border-radius:2px;}

.ptcl{position:fixed;border-radius:50%;pointer-events:none;animation:particle linear infinite;}
.pw-wrap{position:relative;}
.pw-wrap .inp{padding-right:42px;}
.pw-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-faint);font-size:16px;line-height:1;}

/* Left panel */
.login-left{flex:0 0 40%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 44px;position:relative;overflow:hidden;border-right:1px solid var(--border-card);}
[data-theme="dark"] .login-left{background:linear-gradient(145deg,#020818,#0a1628 60%,#020818);}
[data-theme="light"] .login-left{background:linear-gradient(145deg,#eae6dd,#f4f1ea 60%,#eae6dd);}

/* Right panel */
.login-right{flex:1;display:flex;align-items:center;justify-content:center;padding:36px 40px;overflow-y:auto;}

/* Card panel */
.card-panel{background:var(--bg-card2);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:18px;padding:24px;box-shadow:0 20px 56px rgba(0,0,0,.2),inset 0 1px 0 var(--border-card);}

/* Role button */
.role-btn{cursor:pointer;padding:9px 6px;border-radius:9px;font-family:inherit;font-size:11px;font-weight:700;text-align:center;transition:all .2s;width:100%;}

/* Theme toggle in login */
.login-theme-btn{position:fixed;top:16px;right:16px;z-index:200;width:38px;height:38px;border-radius:50%;border:1px solid var(--border-gold);background:var(--bg-card);color:var(--gold);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;transition:all .25s;}
.login-theme-btn:hover{transform:rotate(20deg) scale(1.1);border-color:var(--gold);}

/* Mobile */
@media(max-width:820px){
  .login-split{flex-direction:column!important;}
  .login-left{display:none!important;}
  .login-right{padding:28px 16px!important;align-items:flex-start!important;}
}
@media(max-width:480px){
  .login-right{padding:20px 12px!important;}
  .card-panel{padding:18px 14px!important;border-radius:14px!important;}
}
`;

function roleRedirect(role) {
    if (role === "admin") return "/admin";
    if (role === "lawyer") return "/lawyer";
    if (role === "judge") return "/court";
    return "/dashboard";
}

const LOGIN_FIELDS = {
    user: [{ key: "name", label: "FULL NAME", ph: "e.g. Priya Sharma", req: true }, { key: "city", label: "CITY", ph: "e.g. Bangalore", req: true }],
    lawyer: [{ key: "name", label: "FULL NAME", ph: "Adv. Your Name", req: true }, { key: "barCouncilId", label: "BAR COUNCIL ID", ph: "KAR/2015/XXXX", req: true }],
    judge: [{ key: "name", label: "FULL NAME", ph: "Hon. Justice Name", req: true }, { key: "passcode", label: "JUDGE PASSCODE", ph: "Official passcode", req: true, type: "password", special: "passcode" }],
    admin: [{ key: "name", label: "NAME", ph: "Admin Name", req: true }, { key: "passcode", label: "ADMIN PASSCODE", ph: "Admin passcode", req: true, type: "password", special: "passcode" }],
};

export default function Login() {
    const navigate = useNavigate();
    const { login: handleAuthLogin } = useAuth();
    const { login, authenticated, user, logout } = usePrivySafe();
    const { signMessageAsync } = useSignMessage();
    const { isDark, toggleTheme } = useTheme();

    const [role, setRole] = useState("user");
    const [fields, setFields] = useState({});
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [qIdx, setQIdx] = useState(0);

    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);

    const address = user?.wallet?.address;

    useEffect(() => { setFields({}); setErr(""); setPassword(""); }, [role]);
    useEffect(() => {
        const iv = setInterval(() => setQIdx(i => (i + 1) % QUOTES.length), 5000);
        return () => clearInterval(iv);
    }, []);

    async function validate() {
        if (!authenticated || !address) { setErr("Connect your wallet first."); return false; }
        if (!password) { setErr("Please enter your password."); return false; }
        if (!hasPassword(address)) { setErr("No account found for this wallet. Please register first."); return false; }
        const pwOk = await verifyPassword(address, password);
        if (!pwOk) { setErr("Incorrect password. Please try again."); return false; }
        const defs = LOGIN_FIELDS[role];
        for (const f of defs) {
            if (f.req && !fields[f.key]?.toString().trim()) { setErr(`${f.label} is required.`); return false; }
        }
        if (role === "admin" && fields.passcode !== ADMIN_PASSCODE) { setErr("Invalid admin passcode."); return false; }
        if (role === "judge" && fields.passcode !== JUDGE_PASSCODE) { setErr("Invalid judge passcode."); return false; }
        return true;
    }

    async function handleLogin() {
        setErr("");
        const ok = await validate();
        if (!ok) return;
        setLoading(true);
        try {
            try {
                const message = `Sign in to LexChain\nRole: ${role}\nAddress: ${address}\nTimestamp: ${Date.now()}`;
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
            } catch (_) { /* fall back to local */ }
            const userData = { address, role, name: fields.name || "User", ...fields };
            handleAuthLogin(userData);
            navigate(roleRedirect(role));
        } catch (e) { setErr(e.message || "Login failed. Please try again."); }
        finally { setLoading(false); }
    }

    const fDefs = LOGIN_FIELDS[role];

    return (
        <div className="login-page">
            <style>{STYLES}</style>

            {/* Particles (dark only) */}
            {isDark && [
                { s: 4, l: "20%", d: "9s", del: "0s", c: "rgba(212,160,23,.55)" },
                { s: 5, l: "75%", d: "12s", del: "3s", c: "rgba(37,99,235,.45)" },
                { s: 3, l: "50%", d: "14s", del: "6s", c: "rgba(212,160,23,.35)" }
            ].map((p, i) =>
                <div key={i} className="ptcl" style={{ width: p.s, height: p.s, left: p.l, bottom: 0, background: p.c, animationDuration: p.d, animationDelay: p.del }} />
            )}

            {/* Theme toggle */}
            <button className="login-theme-btn" onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"}>
                {isDark ? "☀️" : "🌙"}
            </button>

            <div className="login-split" style={{ display: "flex", flex: 1 }}>
                {/* Left panel */}
                <div className="login-left">
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--border-card) 1px,transparent 1px),linear-gradient(90deg,var(--border-card) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,160,23,.07) 0%,transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 320, height: 320, border: "1px solid rgba(212,160,23,.1)", borderRadius: "50%", animation: "spin-slow 28s linear infinite" }} />
                    <div style={{ position: "absolute", width: 240, height: 240, border: "1px solid rgba(37,99,235,.07)", borderRadius: "50%", animation: "spin-rev 18s linear infinite" }} />
                    <div style={{ animation: "float 5s ease-in-out infinite", zIndex: 1, marginBottom: 28 }}>
                        <svg width="160" height="160" viewBox="0 0 200 200" fill="none">
                            <rect x="97" y="42" width="7" height="120" fill="url(#lg1)" rx="3" />
                            <circle cx="100" cy="38" r="13" fill="url(#lg2)" />
                            <rect x="28" y="76" width="144" height="7" fill="url(#lg3)" rx="3" />
                            <line x1="50" y1="83" x2="38" y2="140" stroke="#d4a017" strokeWidth="2" strokeDasharray="4 3" />
                            <line x1="150" y1="83" x2="163" y2="140" stroke="#d4a017" strokeWidth="2" strokeDasharray="4 3" />
                            <ellipse cx="38" cy="144" rx="24" ry="7" stroke="#d4a017" strokeWidth="2" fill="rgba(212,160,23,.07)" />
                            <ellipse cx="163" cy="144" rx="24" ry="7" stroke="#d4a017" strokeWidth="2" fill="rgba(212,160,23,.07)" />
                            <defs>
                                <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#b8860b" /><stop offset="50%" stopColor="#f0c040" /><stop offset="100%" stopColor="#b8860b" /></linearGradient>
                                <linearGradient id="lg3" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#d4a017" stopOpacity=".3" /><stop offset="50%" stopColor="#f0c040" /><stop offset="100%" stopColor="#d4a017" stopOpacity=".3" /></linearGradient>
                                <radialGradient id="lg2"><stop offset="0%" stopColor="#f0c040" /><stop offset="100%" stopColor="#b8860b" /></radialGradient>
                            </defs>
                        </svg>
                    </div>
                    <div style={{ textAlign: "center", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 14 }}>
                            <img src="/logo.jpg" alt="LexChain" style={{ height: 30, borderRadius: 6 }} />
                            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 800, background: "linear-gradient(135deg,var(--gold-l),var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LEXCHAIN</span>
                        </div>
                        <div style={{ minHeight: 90, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                            <div key={qIdx} style={{ padding: "14px 20px", background: "rgba(212,160,23,.05)", border: "1px solid rgba(212,160,23,.12)", borderRadius: 11, animation: "quote-fade 5s ease both" }}>
                                <p style={{ fontSize: 12, color: "var(--text-primary)", fontStyle: "italic", lineHeight: 1.7, marginBottom: 6 }}>{QUOTES[qIdx].text}</p>
                                <p style={{ fontSize: 10, color: "var(--gold)", letterSpacing: ".08em" }}>{QUOTES[qIdx].attr}</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {ROLES.map(r => (
                                <div key={r.key} style={{ padding: "8px 12px", background: "rgba(212,160,23,.04)", border: "1px solid var(--border-card)", borderRadius: 8, textAlign: "left" }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.icon} {r.label}</div>
                                    <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{r.key === "user" ? "File cases" : r.key === "lawyer" ? "Represent clients" : r.key === "judge" ? "Issue judgements" : "Manage system"}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="login-right">
                    <div className="login-panel" style={{ width: "100%", maxWidth: 460 }}>
                        <button onClick={() => navigate("/")} style={{ background: "var(--bg-card)", border: "1px solid var(--border-gold)", borderRadius: 7, padding: "7px 14px", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", marginBottom: 20 }}>← Home</button>

                        <div style={{ marginBottom: 16 }}>
                            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Welcome back</h1>
                            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Connect your wallet and enter your password</p>
                        </div>

                        {/* Sign In / Register tabs */}
                        <div style={{ display: "flex", background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: 10, padding: 3, marginBottom: 18 }}>
                            <button className="ltab on">Sign In</button>
                            <button className="ltab" onClick={() => navigate("/register")}>Register</button>
                        </div>

                        <div className="card-panel">
                            {/* Role selector */}
                            <div style={{ marginBottom: 16 }}>
                                <div className="lbl">SELECT YOUR ROLE</div>
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
                            <div style={{ marginBottom: 14 }}>
                                <div className="lbl">STEP 1 — CONNECT WALLET <span className="req">*</span></div>
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
                            <div style={{ marginBottom: 14 }}>
                                <div className="lbl">STEP 2 — ENTER YOUR PASSWORD <span className="req">*</span></div>
                                <div className="fld" style={{ marginTop: 6 }}>
                                    <div className="pw-wrap">
                                        <input
                                            className="inp"
                                            type={showPw ? "text" : "password"}
                                            placeholder="Your account password"
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setErr(""); }}
                                            disabled={!authenticated}
                                            onKeyDown={e => e.key === "Enter" && handleLogin()}
                                        />
                                        <button className="pw-eye" type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                                            {showPw ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                    {address && !hasPassword(address) && authenticated && (
                                        <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
                                            ⚠️ No account found.{" "}
                                            <button onClick={() => navigate("/register")} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600 }}>Register first →</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Details */}
                            <div style={{ marginBottom: 4 }}>
                                <div className="lbl">STEP 3 — YOUR DETAILS</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 8 }}>
                                    {fDefs.map(f => (
                                        <div key={f.key} className="fld">
                                            <label className="lbl" style={{ fontSize: 9 }}>{f.label}{f.req && <span className="req"> *</span>}</label>
                                            <input className="inp" type={f.type || "text"} placeholder={f.ph}
                                                value={fields[f.key] || ""} onChange={e => { setFields(p => ({ ...p, [f.key]: e.target.value })); setErr(""); }}
                                                disabled={!authenticated} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {err && <div className="err-box" style={{ marginTop: 14 }}><span>⚠</span><span>{err}</span></div>}

                            <button className="btn-submit" style={{ marginTop: 16 }} onClick={handleLogin} disabled={loading || !authenticated}>
                                {!authenticated ? "🔒 Connect Wallet First" : loading ? "Signing in..." : "Sign & Login →"}
                            </button>

                            <div style={{ marginTop: 12, padding: "9px 12px", background: "rgba(212,160,23,.04)", border: "1px solid var(--border-card)", borderRadius: 7, fontSize: 11, color: "var(--text-faint)", lineHeight: 1.7 }}>
                                🔒 Secure authentication via MetaMask, Rainbow, Coinbase & more.
                            </div>
                        </div>

                        <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--text-faint)" }}>
                            New to LexChain?{" "}
                            <button onClick={() => navigate("/register")} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>Register →</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
