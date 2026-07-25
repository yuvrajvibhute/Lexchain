import { useState } from 'react';
import { trackEvent, trackPageView } from '../analytics';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CATEGORIES = [
  'Evidence Management',
  'Case Filing',
  'Lawyer Directory',
  'Court Dashboard',
  'Wallet Integration',
  'Overall Experience',
  'Performance / Speed',
  'Mobile Experience',
  'Other',
];

export default function FeedbackPage({ user, onClose }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [category, setCategory] = useState('Overall Experience');
  const [comment, setComment] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!comment.trim()) { setError('Please write a comment.'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        rating,
        category,
        comment: comment.trim(),
        name: name || 'Anonymous',
        email: email || '',
        userId: user?.id || null,
        userRole: user?.role || 'guest',
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
      };
      await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      trackEvent('feedback_submitted', { rating, category });
      setSubmitted(true);
    } catch (err) {
      // Even if backend fails, save locally
      const saved = JSON.parse(localStorage.getItem('lexchain_feedback') || '[]');
      saved.push({ rating, category, comment, name, email, timestamp: new Date().toISOString() });
      localStorage.setItem('lexchain_feedback', JSON.stringify(saved));
      trackEvent('feedback_saved_locally', { rating, category });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: '#d4a017', margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Thank You!</h2>
          <p style={{ color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.6 }}>
            Your feedback has been recorded. It helps us improve LexChain for everyone.
          </p>
          <button onClick={onClose} style={btnPrimaryStyle}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: '#d4a017', margin: 0, fontSize: 22, fontWeight: 800 }}>⭐ Share Your Feedback</h2>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>Help us improve LexChain</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Overall Rating *</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 32, color: star <= (hovered || rating) ? '#d4a017' : '#334155',
                    transition: 'color 0.15s, transform 0.1s',
                    transform: star <= (hovered || rating) ? 'scale(1.2)' : 'scale(1)',
                  }}
                >★</button>
              ))}
              {rating > 0 && (
                <span style={{ color: '#94a3b8', fontSize: 13, alignSelf: 'center', marginLeft: 8 }}>
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Feedback Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={inputStyle}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Your Feedback *</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us about your experience with LexChain..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
            />
          </div>

          {/* Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Name (optional)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email (optional)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={btnPrimaryStyle}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
};
const modalStyle = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  border: '1px solid rgba(212,160,23,0.2)', borderRadius: 16, padding: '28px 32px',
  width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
};
const labelStyle = { color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' };
const inputStyle = {
  width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none',
  marginTop: 6, boxSizing: 'border-box', fontFamily: 'inherit',
};
const btnPrimaryStyle = {
  flex: 1, background: 'linear-gradient(135deg, #d4a017, #b8860b)', color: '#020818',
  border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', transition: 'opacity 0.2s',
};
const btnSecondaryStyle = {
  background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
