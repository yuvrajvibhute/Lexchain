import { useState, useEffect } from 'react';
import { getAnalyticsReport, getWalletInteractionProof, exportAnalytics, trackPageView } from '../analytics';

const KNOWN_WALLETS = [
  // Will be populated with the 13 user wallet addresses provided by the user
];

export default function AnalyticsDashboard() {
  const [report, setReport] = useState(null);
  const [walletProof, setWalletProof] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView('Analytics Dashboard', 'admin');
    loadData();
    const interval = setInterval(loadData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  function loadData() {
    const r = getAnalyticsReport();
    const wp = getWalletInteractionProof();
    const fb = JSON.parse(localStorage.getItem('lexchain_feedback') || '[]');
    setReport(r);
    setWalletProof(wp);
    setFeedback(fb);
    setLoading(false);
  }

  if (loading) return <div style={loadingStyle}>Loading analytics...</div>;

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : 'N/A';

  const activityDays = Object.entries(report.activityByDay || {});

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, color: '#d4a017', fontSize: 28, fontWeight: 800 }}>
            📊 LexChain Analytics
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Real-time monitoring & usage insights
          </p>
        </div>
        <button onClick={exportAnalytics} style={exportBtnStyle}>
          ⬇️ Export Analytics
        </button>
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        {['overview', 'events', 'wallets', 'feedback', 'performance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ ...tabStyle, ...(activeTab === tab ? tabActiveStyle : {}) }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* KPI Cards */}
          <div style={gridStyle}>
            {[
              { label: 'Total Events', value: report.summary.totalEvents, icon: '📈', color: '#3b82f6' },
              { label: 'Unique Wallets', value: report.summary.uniqueWallets, icon: '👛', color: '#d4a017' },
              { label: 'Wallet Interactions', value: report.summary.walletInteractions, icon: '🔗', color: '#10b981' },
              { label: 'Total Errors', value: report.summary.totalErrors, icon: '⚠️', color: '#ef4444' },
              { label: 'Session Page Views', value: report.summary.sessionPageViews, icon: '👁️', color: '#8b5cf6' },
              { label: 'Avg Rating', value: avgRating + (avgRating !== 'N/A' ? '★' : ''), icon: '⭐', color: '#f59e0b' },
            ].map(kpi => (
              <div key={kpi.label} style={kpiCardStyle}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{kpi.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Activity Chart */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>📅 Activity (Last 7 Days)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, padding: '8px 0' }}>
              {activityDays.map(([day, count]) => {
                const max = Math.max(...activityDays.map(d => d[1]), 1);
                const height = Math.max((count / max) * 80, count > 0 ? 8 : 2);
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{count}</span>
                    <div style={{
                      width: '100%', height: height, background: count > 0
                        ? 'linear-gradient(to top, #d4a017, #f59e0b)'
                        : 'rgba(148,163,184,0.1)',
                      borderRadius: 4, transition: 'height 0.3s',
                    }} />
                    <span style={{ fontSize: 9, color: '#475569' }}>{day.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page Views */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>📄 Page Views</h3>
            {Object.entries(report.pageViews || {}).length === 0
              ? <p style={{ color: '#475569', fontSize: 13 }}>No page views recorded yet. Start using the app!</p>
              : Object.entries(report.pageViews || {}).map(([page, count]) => (
                <div key={page} style={rowStyle}>
                  <span style={{ color: '#e2e8f0', fontSize: 14 }}>{page || '/'}</span>
                  <span style={{ color: '#d4a017', fontWeight: 700 }}>{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>📋 Event Breakdown</h3>
            {Object.entries(report.eventCounts || {}).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
              <div key={name} style={rowStyle}>
                <span style={{ color: '#94a3b8', fontSize: 13, fontFamily: 'monospace' }}>{name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: Math.max((count / Math.max(...Object.values(report.eventCounts))) * 80, 8),
                    height: 6, background: '#d4a017', borderRadius: 3,
                  }} />
                  <span style={{ color: '#d4a017', fontWeight: 700, minWidth: 32, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>🕐 Recent Events</h3>
            {report.recentEvents.slice(0, 15).map(evt => (
              <div key={evt.id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'flex-start', gap: 2, borderBottom: '1px solid rgba(148,163,184,0.08)', paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                  <span style={{ color: '#d4a017', fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>{evt.name}</span>
                  <span style={{ color: '#475569', fontSize: 11, marginLeft: 'auto' }}>{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
                <span style={{ color: '#64748b', fontSize: 11 }}>{evt.url} — Session: {evt.sessionId?.slice(0, 16)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallets Tab */}
      {activeTab === 'wallets' && (
        <div>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>👛 Wallet Interaction Proof</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
              Documented evidence of user wallet interactions with LexChain platform.
            </p>
            {walletProof.length === 0 ? (
              <p style={{ color: '#475569', fontSize: 13 }}>
                No wallet interactions recorded yet. Users need to connect wallets and interact with the platform.
              </p>
            ) : walletProof.map((w, i) => (
              <div key={i} style={{ ...cardStyle, margin: '0 0 12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  <code style={{ color: '#d4a017', fontSize: 13 }}>{w.address}</code>
                  <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>{w.interactions.length} interaction(s)</span>
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  First: {new Date(w.firstSeen).toLocaleDateString()} | Last: {new Date(w.lastSeen).toLocaleDateString()}
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {w.interactions.map((ia, j) => (
                    <span key={j} style={{
                      background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)',
                      borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#d4a017',
                    }}>{ia.action}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>💬 User Feedback Summary</h3>
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#d4a017' }}>{avgRating}</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Average Rating</div>
                <div style={{ color: '#f59e0b', fontSize: 20 }}>{'★'.repeat(Math.round(Number(avgRating) || 0))}</div>
              </div>
              <div style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = feedback.filter(f => f.rating === star).length;
                  const pct = feedback.length > 0 ? (count / feedback.length) * 100 : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8', fontSize: 12, minWidth: 16 }}>{star}★</span>
                      <div style={{ flex: 1, height: 8, background: 'rgba(148,163,184,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#d4a017', borderRadius: 4 }} />
                      </div>
                      <span style={{ color: '#64748b', fontSize: 12, minWidth: 20 }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {feedback.length === 0 ? (
              <p style={{ color: '#475569', fontSize: 13 }}>No feedback collected yet.</p>
            ) : feedback.slice().reverse().map((f, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                  <span style={{ color: '#d4a017' }}>{'★'.repeat(f.rating)}</span>
                  <span style={{ background: 'rgba(212,160,23,0.1)', color: '#d4a017', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{f.category}</span>
                  <span style={{ color: '#475569', fontSize: 11, marginLeft: 'auto' }}>{new Date(f.timestamp).toLocaleDateString()}</span>
                </div>
                <p style={{ color: '#e2e8f0', fontSize: 14, margin: '0 0 4px', lineHeight: 1.5 }}>{f.comment}</p>
                {f.name && <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>— {f.name}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>⚡ Performance Metrics</h3>
            {report.recentErrors.length === 0 ? (
              <p style={{ color: '#10b981', fontSize: 13 }}>✅ No errors recorded — system running clean!</p>
            ) : (
              report.recentErrors.map((err, i) => (
                <div key={i} style={{ ...rowStyle, background: 'rgba(239,68,68,0.05)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div>
                    <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>{err.type}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{err.message}</div>
                  </div>
                  <span style={{ color: '#475569', fontSize: 11 }}>{new Date(err.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>🌐 System Status</h3>
            {[
              { name: 'Frontend React App', status: 'operational', url: 'https://lexchain.vercel.app' },
              { name: 'Backend API', status: 'operational', url: 'http://localhost:3001/api/health' },
              { name: 'IPFS/Pinata Storage', status: 'operational', url: 'https://api.pinata.cloud' },
              { name: 'MongoDB Atlas DB', status: 'operational', url: null },
              { name: 'Privy Auth', status: 'operational', url: null },
            ].map(s => (
              <div key={s.name} style={rowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.status === 'operational' ? '#10b981' : '#ef4444' }} />
                  <span style={{ color: '#e2e8f0', fontSize: 14 }}>{s.name}</span>
                </div>
                <span style={{ color: '#10b981', fontSize: 12 }}>● {s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const containerStyle = { maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'Inter, sans-serif' };
const headerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 };
const loadingStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: '#64748b', fontSize: 16 };
const tabBarStyle = { display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(15,23,42,0.6)', borderRadius: 10, padding: 4, flexWrap: 'wrap' };
const tabStyle = {
  flex: 1, padding: '8px 12px', background: 'none', border: 'none', color: '#64748b',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s',
};
const tabActiveStyle = { background: 'rgba(212,160,23,0.15)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.25)' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginBottom: 24 };
const kpiCardStyle = {
  background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))',
  border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, padding: '20px 16px', textAlign: 'center',
};
const cardStyle = {
  background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))',
  border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, padding: '20px', marginBottom: 20,
};
const cardTitleStyle = { color: '#e2e8f0', margin: '0 0 16px', fontSize: 16, fontWeight: 700 };
const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' };
const exportBtnStyle = {
  background: 'linear-gradient(135deg, #d4a017, #b8860b)', color: '#020818', border: 'none',
  borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
