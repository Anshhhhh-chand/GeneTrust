import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Dna, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password };

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}${endpoint}`, payload);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
    }}>
      {}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '45%',
        background: 'linear-gradient(160deg, rgba(79,142,247,0.08) 0%, rgba(167,139,250,0.06) 100%)',
        borderRight: '1px solid rgba(79,142,247,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        pointerEvents: 'none',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #4f8ef7, #a78bfa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem auto',
            boxShadow: '0 0 40px rgba(79,142,247,0.35)',
          }}>
            <Dna size={42} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            GeneTrust Platform
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            AI-powered guide RNA design and real-time lab monitoring for next-generation gene editing research.
          </p>

          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {['DNABERT-2 Powered Predictions', 'Real-Time Lab Sensor Monitoring', 'Batch Analysis & PDF Reports'].map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: ['var(--accent-blue)', 'var(--accent-cyan)', 'var(--accent-violet)'][i],
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${['rgba(79,142,247,0.8)', 'rgba(34,211,238,0.8)', 'rgba(167,139,250,0.8)'][i]}`,
                }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div style={{
        marginLeft: '45%',
        width: '100%',
        maxWidth: '440px',
        padding: '0 1.5rem',
      }}>
        <div className="glass-elevated animate-fade-up" style={{ padding: '2.5rem' }}>
          {}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Dna size={20} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>GeneTrust</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {isLogin ? 'Sign in to continue your research.' : 'Join the genomics research network.'}
            </p>
          </div>

          {error && (
            <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLogin && (
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="input-field"
                  style={{ paddingLeft: '2.75rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="Email address"
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="Password"
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Processing…</>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.textDecorationColor = 'var(--accent-blue)')}
              onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
