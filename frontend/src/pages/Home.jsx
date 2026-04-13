import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

/* ─── Inline styles injected per render (theme-aware via CSS vars) ─── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=Inter:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0) rotateZ(0deg)}50%{transform:translateY(-18px) rotateZ(2deg)}}
@keyframes pulse-dot{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
@keyframes spin-slow{to{transform:rotate(360deg)}}
@keyframes spin-rev{to{transform:rotate(-360deg)}}
@keyframes shimmer{0%{background-position:-300% 0}100%{background-position:300% 0}}
@keyframes glow-pulse{0%,100%{box-shadow:0 0 20px rgba(212,160,23,.15)}50%{box-shadow:0 0 60px rgba(212,160,23,.4)}}
@keyframes particle-rise{0%{transform:translateY(0) scale(0);opacity:0}20%{opacity:.7}100%{transform:translateY(-100vh) scale(1.5);opacity:0}}

/* Utility */
.home-wrap{font-family:'Inter',sans-serif;background:var(--bg-page);color:var(--text-primary);overflow-x:hidden;min-height:100vh;transition:background .3s,color .3s;}
.fade-section{opacity:0;transform:translateY(50px) scale(.97);transition:opacity .9s ease,transform .9s ease;}
.fade-section.visible{opacity:1;transform:translateY(0) scale(1);}
.slide-left{opacity:0;transform:translateX(-60px);transition:opacity .8s ease,transform .8s ease;}
.slide-left.visible{opacity:1;transform:translateX(0);}
.slide-right{opacity:0;transform:translateX(60px);transition:opacity .8s ease,transform .8s ease;}
.slide-right.visible{opacity:1;transform:translateX(0);}
.tilt-card{transition:transform .2s ease,box-shadow .2s ease;}
.tilt-card:hover{transform:perspective(800px) rotateX(-4deg) rotateY(4deg) translateY(-6px);box-shadow:0 30px 80px rgba(0,0,0,.3);}

/* Nav */
.nav-link{color:var(--text-muted);text-decoration:none;font-size:14px;font-weight:500;transition:color .2s;position:relative;}
.nav-link::after{content:'';position:absolute;bottom:-3px;left:0;right:0;height:1px;background:var(--gold);transform:scaleX(0);transition:transform .25s;}
.nav-link:hover{color:var(--text-primary);}
.nav-link:hover::after{transform:scaleX(1);}

/* Mobile nav links (drawer) */
.mob-nav-link{color:var(--text-muted);text-decoration:none;font-size:15px;font-weight:500;padding:8px 0;border-bottom:1px solid var(--border-gold);transition:color .2s;}
.mob-nav-link:hover{color:var(--gold);}

/* Buttons */
.btn-gold{cursor:pointer;background:linear-gradient(135deg,var(--gold),var(--gold-d));border:none;border-radius:10px;padding:13px 30px;color:#020818;font-family:inherit;font-size:15px;font-weight:800;letter-spacing:.02em;transition:all .25s;animation:glow-pulse 3s ease-in-out infinite;}
.btn-gold:hover{transform:translateY(-3px);filter:brightness(1.15);}
.btn-outline{cursor:pointer;background:transparent;border:1px solid var(--border-gold);border-radius:10px;padding:13px 30px;color:var(--gold);font-family:inherit;font-size:15px;font-weight:600;transition:all .25s;}
.btn-outline:hover{background:rgba(212,160,23,.08);border-color:var(--gold);transform:translateY(-3px);}

/* Glass */
.glass{background:var(--glass-bg);backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:18px;}

/* Shimmer text */
.shimmer-text{background:linear-gradient(90deg,var(--gold-l) 0%,#fff 30%,var(--gold-l) 60%,var(--gold-d) 100%);background-size:300% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 5s linear infinite;}

/* Dark shimmer fix for light mode */
[data-theme="light"] .shimmer-text{background:linear-gradient(90deg,#b8860b 0%,#5a3e00 30%,#b8860b 60%,#7a5500 100%);background-size:300% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 5s linear infinite;}

/* Feature cards */
.feat-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:28px 24px;transition:all .3s;position:relative;overflow:hidden;}
.feat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);transform:scaleX(0);transition:transform .4s;}
.feat-card:hover::before{transform:scaleX(1);}
.feat-card:hover{border-color:var(--border-gold);transform:translateY(-8px);}

/* Law card */
.law-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:14px;padding:22px;transition:all .3s;}
.law-card:hover{border-color:var(--border-gold);box-shadow:0 20px 60px rgba(212,160,23,.08);}

/* Stats number */
.stat-num{font-size:42px;font-weight:900;background:linear-gradient(135deg,var(--gold-l),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;}

/* Timeline step card */
.step-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:28px 22px;position:relative;transition:all .3s;}
.step-card::after{content:'';position:absolute;right:-24px;top:50%;transform:translateY(-50%);width:24px;height:2px;background:linear-gradient(90deg,rgba(212,160,23,.5),transparent);}
.step-card:last-child::after{display:none;}
.step-card:hover{border-color:var(--border-gold);transform:perspective(600px) rotateY(-5deg) translateZ(10px);}

/* Testimonial */
.testi-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:28px;transition:all .3s;}
.testi-card:hover{border-color:var(--border-gold);transform:translateY(-6px);}

/* Particle */
.particle{position:fixed;pointer-events:none;border-radius:50%;animation:particle-rise linear infinite;}

/* CTA section */
.cta-wrap{background:linear-gradient(135deg,rgba(37,99,235,.1) 0%,rgba(212,160,23,.08) 100%);border:1px solid var(--border-gold);border-radius:28px;padding:72px 48px;text-align:center;position:relative;overflow:hidden;}
.cta-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(212,160,23,.05) 0%,transparent 70%);}

/* Stat border responsive */
.stat-item{text-align:center;padding:32px 20px;border-right:1px solid var(--border-card);}
.stat-item:last-child{border-right:none;}

/* ── Responsive tweaks ───────────────────────────────────────────────── */
@media(max-width:900px){
  .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
  .stat-item:nth-child(2){border-right:none;}
  .step-card::after{display:none!important;}
  .steps-grid{grid-template-columns:repeat(2,1fr)!important;}
  .feat-grid{grid-template-columns:repeat(2,1fr)!important;}
  .law-grid{grid-template-columns:1fr!important;}
  .testi-grid{grid-template-columns:1fr!important;}
  .cta-wrap{padding:48px 28px!important;}
  .hero-scales{display:none!important;}
}
@media(max-width:600px){
  .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
  .stat-item{padding:20px 12px!important;}
  .stat-num{font-size:28px!important;}
  .steps-grid{grid-template-columns:1fr!important;}
  .feat-grid{grid-template-columns:1fr!important;}
  .law-grid{grid-template-columns:1fr!important;}
  .section-pad{padding:40px 16px 60px!important;}
  .hero-card{padding:14px 16px!important;}
  .cta-wrap{padding:36px 18px!important;}
  .footer-inner{flex-direction:column!important;gap:12px!important;text-align:center!important;}
  .nav-inner{padding:0 16px!important;}
  .btn-gold{padding:11px 22px!important;font-size:13px!important;}
  .btn-outline{padding:11px 22px!important;font-size:13px!important;}
}
`;

function useReveal() {
    useEffect(() => {
        const els = document.querySelectorAll(".fade-section,.slide-left,.slide-right");
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
        }, { threshold: 0.1 });
        els.forEach(el => obs.observe(el));
        return () => obs.disconnect();
    }, []);
}

function useCounter(target, isVisible) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!isVisible) return;
        let start = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
            start = Math.min(start + step, target);
            setVal(start);
            if (start >= target) clearInterval(timer);
        }, 25);
        return () => clearInterval(timer);
    }, [isVisible, target]);
    return val;
}

function StatItem({ value, label, icon, suffix = "" }) {
    const ref = useRef(null);
    const [vis, setVis] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.5 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    const count = useCounter(value, vis);
    return (
        <div ref={ref} className="stat-item">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            <div className="stat-num">{count.toLocaleString("en-IN")}{suffix}</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6, letterSpacing: ".08em", fontFamily: "'IBM Plex Mono',monospace" }}>{label.toUpperCase()}</div>
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [block, setBlock] = useState(19851890);
    const [scrollY, setScrollY] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const [menuOpen, setMenuOpen] = useState(false);
    const heroRef = useRef(null);

    useReveal();

    useEffect(() => {
        const iv = setInterval(() => setBlock(b => b + 1), 1000);
        const onScroll = () => setScrollY(window.scrollY);
        const onMouse = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("mousemove", onMouse, { passive: true });
        return () => { clearInterval(iv); window.removeEventListener("scroll", onScroll); window.removeEventListener("mousemove", onMouse); };
    }, []);

    // Close menu on scroll
    useEffect(() => { if (menuOpen) setMenuOpen(false); }, [scrollY]);

    const parallaxY = scrollY * 0.35;
    const parallaxRot = scrollY * 0.03;
    const heroOpacity = Math.max(0, 1 - scrollY / 600);

    const FEATURES = [
        ["⛓️", "Chain of Custody", "Every Transfer, verification & court admission is permanently recorded on-chain with officer signatures and timestamps."],
        ["🛡️", "Role-Based Portals", "Separate interfaces for police, forensic labs, lawyers & judges. Each role sees only what's relevant and authorised."],
        ["⚡", "Real-Time Verification", "Verify any evidence hash, transaction ID or evidence ID instantly. No waiting, no middlemen, no trust required."],
        ["🌐", "IPFS Decentralised", "Files stored across thousands of global nodes — no single point of failure, no censorship, no data loss ever."],
        ["📜", "Court-Ready Reports", "Generate cryptographically-signed PDF reports accepted in Indian courts under IT Act Section 65B."],
        ["🔑", "Google & Wallet Auth", "Sign in with Google or a crypto wallet. Zero friction onboarding for officers without technical background."],
    ];

    const LAW_CARDS = [
        { icon: "⚖️", act: "Indian Evidence Act, 1872", section: "Section 65B", desc: "Electronic records admissible as evidence when accompanied with a certificate from a responsible official." },
        { icon: "🏛️", act: "Information Technology Act, 2000", section: "Section 79A", desc: "Defines 'digital evidence examiners' and lays grounds for admissibility of digital forensic reports." },
        { icon: "📖", act: "IPC / BNS 2023", section: "Section 378-420", desc: "Blockchain hash log provides an indisputable audit trail for theft, fraud and cognizable offences." },
        { icon: "🔐", act: "Supreme Court Guidelines", section: "2024 Direction", desc: "SC directed all high courts to adopt blockchain-based evidence management for criminal trials by 2026." },
    ];

    const STEPS = [
        ["01", "🔐", "Hash File", "SHA-256 computed locally. Your original file never leaves your device."],
        ["02", "📡", "IPFS Store", "File pinned to a decentralised content-addressed storage network."],
        ["03", "⛓️", "Chain Anchor", "Hash + metadata written immutably to the Ethereum blockchain."],
        ["04", "🏛️", "Court Verify", "Any party can independently verify authenticity—instantly, for free."],
    ];

    const TESTIMONIALS = [
        { quote: "LexChain has revolutionised how we preserve digital evidence. Tampering is now impossible.", name: "Adv. Priya Nair", role: "Senior Advocate, Kerala HC" },
        { quote: "We closed three digital fraud cases 60% faster because evidence integrity was never in question.", name: "Supt. Ramesh Kumar", role: "Cyber Crime Division, Bengaluru" },
        { quote: "First time in my career that defence counsel actually accepted digital evidence without challenge.", name: "Hon. Justice A. Sharma", role: "District & Sessions Court, Delhi" },
    ];

    const navBg = scrollY > 40
        ? (isDark ? "rgba(2,8,24,.97)" : "rgba(244,241,234,.97)")
        : "transparent";
    const navBorder = scrollY > 40 ? "1px solid var(--border-gold)" : "none";

    return (
        <div className="home-wrap">
            <style>{STYLES}</style>

            {/* Particles — dark mode only */}
            {isDark && [
                { s: 4, l: "10%", d: "12s", del: "0s", c: "rgba(212,160,23,.7)" },
                { s: 5, l: "30%", d: "16s", del: "3s", c: "rgba(37,99,235,.6)" },
                { s: 3, l: "55%", d: "10s", del: "6s", c: "rgba(212,160,23,.5)" },
                { s: 6, l: "75%", d: "14s", del: "1s", c: "rgba(96,165,250,.5)" },
                { s: 4, l: "90%", d: "18s", del: "4s", c: "rgba(212,160,23,.6)" },
            ].map((p, i) => (
                <div key={i} className="particle" style={{ width: p.s, height: p.s, left: p.l, bottom: 0, background: p.c, animationDuration: p.d, animationDelay: p.del }} />
            ))}

            {/* ── NAVBAR ── */}
            <nav style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                height: 66,
                background: navBg,
                backdropFilter: scrollY > 40 ? "blur(24px)" : "none",
                borderBottom: navBorder,
                transition: "all .3s",
            }}>
                <div className="nav-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src="/logo.jpg" alt="LexChain" style={{ height: 34, borderRadius: 7 }} />
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 800, background: "linear-gradient(135deg,var(--gold-l),var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LEXCHAIN</span>
                    </div>

                    {/* Desktop links */}
                    <div className="desktop-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
                        <a href="#how" className="nav-link">How It Works</a>
                        <a href="#law" className="nav-link">Law & Act</a>
                        <a href="#features" className="nav-link">Features</a>
                        <button className="theme-toggle" onClick={toggleTheme} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                            {isDark ? "☀️" : "🌙"}
                        </button>
                        {user ? (
                            <button className="btn-gold" style={{ padding: "9px 20px", fontSize: 13 }} onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}>Dashboard →</button>
                        ) : (
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn-outline" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => navigate("/login")}>Sign In</button>
                                <button className="btn-gold" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => navigate("/register")}>Register</button>
                            </div>
                        )}
                    </div>

                    {/* Mobile controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button className="theme-toggle" style={{ display: "none" }} id="theme-toggle-hidden" onClick={toggleTheme}>
                            {isDark ? "☀️" : "🌙"}
                        </button>
                        <style>{`@media(max-width:768px){#theme-toggle-hidden{display:flex!important;}}`}</style>
                        <button
                            className={`hamburger${menuOpen ? " open" : ""}`}
                            onClick={() => setMenuOpen(v => !v)}
                            aria-label="Toggle menu"
                        >
                            <span /><span /><span />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div className={`mobile-drawer${menuOpen ? " open" : ""}`}>
                <a href="#how" className="mob-nav-link" onClick={() => setMenuOpen(false)}>How It Works</a>
                <a href="#law" className="mob-nav-link" onClick={() => setMenuOpen(false)}>Law & Act</a>
                <a href="#features" className="mob-nav-link" onClick={() => setMenuOpen(false)}>Features</a>
                <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                    {user ? (
                        <button className="btn-gold" style={{ flex: 1, padding: "11px", fontSize: 14 }} onClick={() => { navigate(user.role === "admin" ? "/admin" : "/dashboard"); setMenuOpen(false); }}>Dashboard →</button>
                    ) : (
                        <>
                            <button className="btn-outline" style={{ flex: 1, padding: "11px", fontSize: 14 }} onClick={() => { navigate("/login"); setMenuOpen(false); }}>Sign In</button>
                            <button className="btn-gold" style={{ flex: 1, padding: "11px", fontSize: 14 }} onClick={() => { navigate("/register"); setMenuOpen(false); }}>Register</button>
                        </>
                    )}
                </div>
            </div>

            {/* ── HERO ── */}
            <section ref={heroRef} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", paddingTop: 66 }}>
                {/* Background grid */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `linear-gradient(var(--border-card) 1px,transparent 1px),linear-gradient(90deg,var(--border-card) 1px,transparent 1px)`,
                    backgroundSize: "60px 60px",
                    transform: `perspective(800px) rotateX(${20 + scrollY * 0.02}deg) translateY(${scrollY * 0.1}px)`,
                    transformOrigin: "top center",
                    pointerEvents: "none",
                }} />
                {/* Radial glows */}
                <div style={{ position: "absolute", width: "min(800px,90vw)", height: "min(800px,90vw)", borderRadius: "50%", background: "radial-gradient(circle,rgba(212,160,23,.08) 0%,transparent 70%)", top: "50%", left: "50%", transform: `translate(-60%,-50%) translateY(${scrollY * .15}px)`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", width: "min(500px,60vw)", height: "min(500px,60vw)", borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.1) 0%,transparent 70%)", top: "30%", right: "8%", pointerEvents: "none" }} />

                {/* 3D Scales — hidden on mobile via .hero-scales */}
                <div className="hero-scales" style={{
                    position: "absolute", right: "8%", top: "50%",
                    transform: `translateY(calc(-50% + ${parallaxY * .4}px)) rotateZ(${parallaxRot}deg)`,
                    opacity: heroOpacity, transition: "opacity .1s",
                }}>
                    <div style={{ position: "relative", width: 280, height: 280 }}>
                        <div style={{ position: "absolute", inset: -30, border: "1px solid rgba(212,160,23,.12)", borderRadius: "50%", animation: "spin-slow 25s linear infinite" }} />
                        <div style={{ position: "absolute", inset: -60, border: "1px solid rgba(37,99,235,.08)", borderRadius: "50%", animation: "spin-rev 35s linear infinite" }} />
                        <div style={{ animation: "float 5s ease-in-out infinite" }}>
                            <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
                                <rect x="135" y="50" width="10" height="175" fill="url(#pg)" rx="5" />
                                <circle cx="140" cy="46" r="18" fill="url(#og)" />
                                <rect x="40" y="106" width="200" height="8" fill="url(#bg)" rx="4" />
                                <line x1="68" y1="114" x2="56" y2="185" stroke="#d4a017" strokeWidth="2.5" strokeDasharray="5 4" />
                                <line x1="212" y1="114" x2="224" y2="185" stroke="#d4a017" strokeWidth="2.5" strokeDasharray="5 4" />
                                <ellipse cx="56" cy="190" rx="28" ry="9" stroke="#d4a017" strokeWidth="2.5" fill="rgba(212,160,23,.06)" />
                                <ellipse cx="224" cy="190" rx="28" ry="9" stroke="#d4a017" strokeWidth="2.5" fill="rgba(212,160,23,.06)" />
                                <rect x="105" y="222" width="70" height="10" fill="url(#pg)" rx="5" />
                                <rect x="120" y="210" width="40" height="14" fill="url(#pg)" rx="4" />
                                {[68, 140, 212].map(cx => <circle key={cx} cx={cx} cy="110" r="5" fill="#d4a017" opacity=".8" />)}
                                <defs>
                                    <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#b8860b" /><stop offset="50%" stopColor="#f0c040" /><stop offset="100%" stopColor="#b8860b" /></linearGradient>
                                    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#d4a017" stopOpacity=".3" /><stop offset="50%" stopColor="#f0c040" /><stop offset="100%" stopColor="#d4a017" stopOpacity=".3" /></linearGradient>
                                    <radialGradient id="og"><stop offset="0%" stopColor="#f0c040" /><stop offset="100%" stopColor="#b8860b" /></radialGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Hero text */}
                <div style={{ textAlign: "center", maxWidth: 860, padding: "0 20px", position: "relative", zIndex: 1, opacity: heroOpacity, transform: `translateY(${scrollY * .12}px)` }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,160,23,.08)", border: "1px solid rgba(212,160,23,.25)", borderRadius: 100, padding: "6px 18px", marginBottom: 32, fontSize: 12, color: "var(--gold)", fontFamily: "'IBM Plex Mono',monospace", animation: "fadeUp .7s ease both" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
                        MAINNET LIVE · BLOCK #{block.toLocaleString("en-IN")}
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(36px,6.5vw,82px)", fontWeight: 900, lineHeight: 1.06, marginBottom: 24, animation: "fadeUp .7s .1s ease both" }}>
                        <span className="shimmer-text">India's Blockchain</span><br />
                        <span style={{ color: "var(--text-primary)" }}>Court Evidence Ledger</span>
                    </h1>
                    <p style={{ fontSize: "clamp(14px,2vw,19px)", color: "var(--text-muted)", lineHeight: 1.8, marginBottom: 40, maxWidth: 620, margin: "0 auto 40px", animation: "fadeUp .7s .2s ease both" }}>
                        Immutable. Tamper-evident. Blockchain-anchored.<br />
                        Every piece of evidence — verifiably authentic under <strong style={{ color: "var(--gold)" }}>IT Act Section 65B</strong>.
                    </p>
                    <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp .7s .35s ease both" }}>
                        <button className="btn-gold" style={{ fontSize: 15 }} onClick={() => navigate(user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/register")}>
                            🚀 Get Started Free
                        </button>
                        <button className="btn-outline" style={{ fontSize: 15 }} onClick={() => navigate("/login")}>
                            🔐 Sign In
                        </button>
                    </div>

                    {/* Floating evidence card */}
                    <div className="glass hero-card" style={{ maxWidth: 560, margin: "56px auto 0", padding: "22px 26px", textAlign: "left", animation: "float 4.5s ease-in-out infinite" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 2s infinite" }} />
                            <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "monospace", letterSpacing: ".1em" }}>TRANSACTION ANCHORED · BLOCK #19851919</span>
                        </div>
                        {[["EV-2024-001", "FIR_Case_2024_Bangalore.pdf", "VERIFIED", "#22c55e"],
                          ["EV-2024-002", "CCTV_ATM_23Feb.mp4", "VERIFIED", "#22c55e"],
                          ["EV-2024-003", "Forensic_NarcoReport.pdf", "PENDING", "#f59e0b"]].map(([id, name, st, c]) => (
                            <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", fontSize: 12, borderBottom: "1px solid var(--border-card)", flexWrap: "wrap", gap: 6 }}>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <span style={{ color: "var(--gold)", fontFamily: "monospace", fontWeight: 600 }}>{id}</span>
                                    <span style={{ color: "var(--text-muted)" }}>{name}</span>
                                </div>
                                <span style={{ color: c, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>● {st}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className="section-pad" style={{ padding: "0 24px 80px" }}>
                <div className="glass fade-section stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderRadius: 18, maxWidth: 1100, margin: "0 auto" }}>
                    <StatItem value={3482} label="Evidence Records" icon="📂" />
                    <StatItem value={2891} label="Verified On-Chain" icon="✅" />
                    <StatItem value={47} label="Active Cases" icon="⚖️" />
                    <StatItem value={100} label="Tamper Proof" icon="🔒" suffix="%" />
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="how" className="section-pad" style={{ padding: "60px 24px 100px" }}>
                <div className="fade-section" style={{ textAlign: "center", marginBottom: 56 }}>
                    <div style={{ fontSize: 11, color: "var(--gold)", fontFamily: "monospace", letterSpacing: ".15em", marginBottom: 12 }}>HOW IT WORKS</div>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, background: "linear-gradient(135deg,var(--text-primary),var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Four Steps to Immutable Evidence
                    </h2>
                </div>
                <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
                    {STEPS.map(([n, icon, title, desc], i) => (
                        <div key={n} className={`step-card ${i % 2 === 0 ? "slide-left" : "slide-right"}`}>
                            <div style={{ fontSize: 11, color: "var(--gold)", fontFamily: "monospace", fontWeight: 700, marginBottom: 14 }}>{n}</div>
                            <div style={{ fontSize: 36, marginBottom: 14 }}>{icon}</div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{title}</h3>
                            <p style={{ fontSize: 13, color: "var(--text-faint)", lineHeight: 1.7 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── LAW IN INDIA ── */}
            <section id="law" className="section-pad" style={{ padding: "60px 24px 100px", background: isDark ? "rgba(10,22,40,.4)" : "rgba(0,0,0,.03)" }}>
                <div className="fade-section" style={{ textAlign: "center", marginBottom: 56 }}>
                    <div style={{ fontSize: 11, color: "var(--gold)", fontFamily: "monospace", letterSpacing: ".15em", marginBottom: 12 }}>LEGAL FRAMEWORK</div>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, background: "linear-gradient(135deg,var(--text-primary),var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        India's Law & Digital Evidence
                    </h2>
                    <p style={{ fontSize: 15, color: "var(--text-faint)", maxWidth: 600, margin: "14px auto 0", lineHeight: 1.7 }}>
                        LexChain is built in full compliance with India's evolving digital evidence landscape.
                    </p>
                </div>
                <div className="law-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, maxWidth: 1100, margin: "0 auto" }}>
                    {LAW_CARDS.map((c, i) => (
                        <div key={c.act} className={`law-card tilt-card ${i % 2 === 0 ? "slide-left" : "slide-right"}`}>
                            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                <div style={{ fontSize: 34, lineHeight: 1, flexShrink: 0 }}>{c.icon}</div>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--gold)", fontFamily: "monospace", letterSpacing: ".1em", marginBottom: 6 }}>{c.section}</div>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{c.act}</h3>
                                    <p style={{ fontSize: 13, color: "var(--text-faint)", lineHeight: 1.7 }}>{c.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Quote bar */}
                <div className="fade-section glass" style={{ maxWidth: 800, margin: "48px auto 0", padding: "26px 32px", textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.9, marginBottom: 10, fontFamily: "'Playfair Display',serif" }}>
                        "The integrity of digital evidence is paramount in the age of cybercrime. Blockchain provides an indelible, court-admissible audit trail."
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gold)", letterSpacing: ".08em" }}>— National Cyber Forensics Lab, Ministry of Home Affairs, India</div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" className="section-pad" style={{ padding: "60px 24px 100px" }}>
                <div className="fade-section" style={{ textAlign: "center", marginBottom: 56 }}>
                    <div style={{ fontSize: 11, color: "var(--gold)", fontFamily: "monospace", letterSpacing: ".15em", marginBottom: 12 }}>FEATURES</div>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, background: "linear-gradient(135deg,var(--text-primary),var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Built for India's Justice System
                    </h2>
                </div>
                <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, maxWidth: 1100, margin: "0 auto" }}>
                    {FEATURES.map(([icon, title, desc], i) => (
                        <div key={title} className={`feat-card ${i % 2 === 0 ? "slide-left" : "slide-right"}`}>
                            <div style={{ fontSize: 34, marginBottom: 16 }}>{icon}</div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{title}</h3>
                            <p style={{ fontSize: 13, color: "var(--text-faint)", lineHeight: 1.75 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section className="section-pad" style={{ padding: "0 24px 100px", background: isDark ? "rgba(10,22,40,.4)" : "rgba(0,0,0,.03)" }}>
                <div className="fade-section" style={{ textAlign: "center", marginBottom: 56 }}>
                    <div style={{ fontSize: 11, color: "var(--gold)", fontFamily: "monospace", letterSpacing: ".15em", marginBottom: 12 }}>TESTIMONIALS</div>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, background: "linear-gradient(135deg,var(--text-primary),var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Trusted by Legal Professionals
                    </h2>
                </div>
                <div className="testi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, maxWidth: 1100, margin: "0 auto" }}>
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className={`testi-card ${i % 2 === 0 ? "slide-left" : "slide-right"}`}>
                            <div style={{ fontSize: 26, marginBottom: 14, color: "var(--gold)" }}>❝</div>
                            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.8, marginBottom: 18, fontStyle: "italic" }}>{t.quote}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 14, borderTop: "1px solid var(--border-card)" }}>
                                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,var(--gold),var(--gold-d))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#020818", flexShrink: 0 }}>
                                    {t.name[0]}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{t.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="fade-section section-pad" style={{ padding: "0 24px 100px" }}>
                <div className="cta-wrap" style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, color: "var(--text-primary)", marginBottom: 18, position: "relative", fontSize: "clamp(24px,4vw,52px)" }}>
                        Ready to secure evidence on-chain?
                    </h2>
                    <p style={{ fontSize: "clamp(14px,1.8vw,17px)", color: "var(--text-muted)", marginBottom: 40, position: "relative" }}>
                        Join thousands of law enforcement officers across India using LexChain today.
                    </p>
                    <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
                        <button className="btn-gold" style={{ fontSize: 16 }} onClick={() => navigate("/register")}>
                            🚀 Create Free Account
                        </button>
                        <button className="btn-outline" style={{ fontSize: 16 }} onClick={() => navigate("/login")}>
                            🔐 Sign In
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: "1px solid var(--border-card)", padding: "28px 24px" }}>
                <div className="footer-inner" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src="/logo.jpg" alt="LexChain" style={{ height: 26, borderRadius: 5 }} />
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700, color: "var(--text-faint)" }}>LEXCHAIN</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-faint2)" }}>All records are cryptographically tamper-evident. For official use only.</div>
                    <div style={{ fontSize: 12, color: "var(--text-faint2)" }}>© 2026 LexChain · India</div>
                </div>
            </footer>
        </div>
    );
}
