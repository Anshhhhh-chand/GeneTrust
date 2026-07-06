import React, { useState } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, ShieldX, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { OffTargetResult, OffTargetSite } from '../types';

interface Props {
  sequence: string;
}

const RISK_CONFIG = {
  HIGH:   { color: 'var(--accent-red)',    bg: 'rgba(239,68,68,0.10)',   icon: ShieldX,     label: 'HIGH' },
  MEDIUM: { color: '#f97316',              bg: 'rgba(249,115,22,0.10)',  icon: ShieldAlert, label: 'MEDIUM' },
  LOW:    { color: 'var(--accent-green)',  bg: 'rgba(52,211,153,0.10)',  icon: ShieldCheck, label: 'LOW' },
};

const RiskBadge: React.FC<{ risk: 'HIGH' | 'MEDIUM' | 'LOW' }> = ({ risk }) => {
  const cfg = RISK_CONFIG[risk];
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
      borderRadius: '100px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 700,
    }}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
};

const ScoreBar: React.FC<{ score: number; risk: 'HIGH' | 'MEDIUM' | 'LOW' }> = ({ score, risk }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <div style={{ flex: 1, height: '5px', background: 'var(--bg-base)', borderRadius: '100px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${score * 100}%`,
        background: RISK_CONFIG[risk].color,
        borderRadius: '100px', transition: 'width 0.4s ease',
      }} />
    </div>
    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '35px', textAlign: 'right' }}>
      {(score * 100).toFixed(1)}%
    </span>
  </div>
);

export const OffTargetPanel: React.FC<Props> = ({ sequence }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OffTargetResult | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [showAll, setShowAll] = useState(false);

  const runAnalysis = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await axios.post(
        `${apiUrl}/api/offtarget`,
        { sequence },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      setFilter('ALL');
      setShowAll(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Off-target analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSites: OffTargetSite[] = result
    ? (filter === 'ALL' ? result.sites : result.sites.filter(s => s.risk === filter))
    : [];
  const visibleSites = showAll ? filteredSites : filteredSites.slice(0, 15);

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '1.5rem',
      }}>
        {}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={18} color="var(--accent-violet)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Off-Target Risk Analysis</h3>
            <span style={{
              fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '100px',
              background: 'rgba(139,92,246,0.15)', color: 'var(--accent-violet)', fontWeight: 600,
            }}>HEURISTIC</span>
          </div>
          <button
            className="btn btn-ghost"
            onClick={runAnalysis}
            disabled={loading}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {loading ? <><Loader2 size={13} className="animate-spin" /> Scanning…</> : <><ShieldAlert size={13} /> Analyse</>}
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
          Scores all 1-mismatch and top 2-mismatch variants by seed-region penalty, GC binding thermodynamics, and PAM-proximity heuristics.
        </p>

        {error && <div className="alert-error"><AlertCircle size={14} /> {error}</div>}

        {result && (
          <>
            {}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {(['HIGH', 'MEDIUM', 'LOW'] as const).map(risk => {
                const count = risk === 'HIGH' ? result.high_risk_count : risk === 'MEDIUM' ? result.medium_risk_count : result.low_risk_count;
                const cfg = RISK_CONFIG[risk];
                const Icon = cfg.icon;
                return (
                  <button
                    key={risk}
                    onClick={() => setFilter(filter === risk ? 'ALL' : risk)}
                    style={{
                      background: filter === risk ? cfg.bg : 'var(--bg-base)',
                      border: `1px solid ${filter === risk ? cfg.color : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)', padding: '0.85rem',
                      cursor: 'pointer', textAlign: 'center', transition: 'var(--transition-default)',
                    }}
                  >
                    <Icon size={20} color={cfg.color} style={{ display: 'block', margin: '0 auto 0.35rem auto' }} />
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: cfg.color }}>{count}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{risk} RISK</div>
                  </button>
                );
              })}
            </div>

            {}
            <div style={{
              padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-md)',
              background: result.high_risk_count > 10 ? 'rgba(239,68,68,0.08)' : result.high_risk_count > 0 ? 'rgba(249,115,22,0.08)' : 'rgba(52,211,153,0.08)',
              border: `1px solid ${result.high_risk_count > 10 ? 'rgba(239,68,68,0.3)' : result.high_risk_count > 0 ? 'rgba(249,115,22,0.3)' : 'rgba(52,211,153,0.3)'}`,
              fontSize: '0.85rem', color: 'var(--text-secondary)',
            }}>
              {result.summary}
            </div>

            {}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setShowAll(false); }}
                  style={{
                    padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600,
                    border: `1px solid ${filter === f ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                    background: filter === f ? 'rgba(79,142,247,0.15)' : 'transparent',
                    color: filter === f ? 'var(--accent-blue)' : 'var(--text-muted)', cursor: 'pointer',
                    transition: 'var(--transition-default)',
                  }}
                >
                  {f} {f !== 'ALL' && `(${f === 'HIGH' ? result.high_risk_count : f === 'MEDIUM' ? result.medium_risk_count : result.low_risk_count})`}
                </button>
              ))}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 'auto' }}>
                {filteredSites.length} sites
              </span>
            </div>

            {}
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Variant Sequence</th>
                    <th>Pos</th>
                    <th>Change</th>
                    <th>MM</th>
                    <th>Region</th>
                    <th>Risk</th>
                    <th style={{ minWidth: '120px' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSites.map((site, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', letterSpacing: '1px' }}>
                        {site.variant.split('').map((base, bi) => (
                          <span key={bi} style={{ color: bi === site.position - 1 ? RISK_CONFIG[site.risk].color : 'var(--text-secondary)' }}>
                            {base}
                          </span>
                        ))}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{site.position}</td>
                      <td>
                        <code style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--accent-red)' }}>{site.original_base}</span>→
                          <span style={{ color: RISK_CONFIG[site.risk].color }}>{site.new_base}</span>
                        </code>
                      </td>
                      <td style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{site.mismatches}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{site.region}</td>
                      <td><RiskBadge risk={site.risk} /></td>
                      <td><ScoreBar score={site.score} risk={site.risk} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSites.length > 15 && (
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  width: '100%', marginTop: '0.75rem', padding: '0.5rem',
                  background: 'transparent', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  transition: 'var(--transition-default)',
                }}
              >
                {showAll ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {filteredSites.length} sites</>}
              </button>
            )}
          </>
        )}

        {!result && !loading && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Click <strong>Analyse</strong> to scan for potential off-target binding sites in this guide RNA.
          </div>
        )}
      </div>
    </div>
  );
};
