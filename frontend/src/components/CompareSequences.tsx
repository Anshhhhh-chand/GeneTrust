import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, Search, AlertCircle, Activity, Percent } from 'lucide-react';
import type { CompareResult } from '../types';

export const CompareSequences: React.FC = () => {
  const [seq1, setSeq1] = useState('');
  const [seq2, setSeq2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState('');

  const compareSequences = async () => {
    setError('');
    if (!seq1 || !seq2) {
      setError('Both sequences are required.');
      return;
    }
    if (!/^[ATCG-]+$/i.test(seq1) || !/^[ATCG-]+$/i.test(seq2)) {
      setError('Sequences must only contain A, T, C, G bases (or - for gaps).');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(
        `${apiUrl}/api/compare`,
        { sequence1: seq1, sequence2: seq2 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Comparison failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (char: string) => {
    if (char === '|') return 'var(--accent-green)';
    if (char === '.') return 'var(--accent-red)';
    return 'var(--text-muted)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Activity size={20} color="var(--accent-violet)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Sequence Alignment Engine</h2>
        </div>
        <p style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Enter two sequences to perform a Needleman-Wunsch pairwise alignment and compare biochemical properties.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Sequence A</label>
            <input
              type="text" placeholder="e.g. CTACTTCAAATGGGGCTACA" className="input-field mono"
              value={seq1} onChange={(e) => setSeq1(e.target.value.toUpperCase().replace(/[^ATCG-]/g, ''))}
              style={{ letterSpacing: '3px', fontSize: '1rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Sequence B</label>
            <input
              type="text" placeholder="e.g. CTACTTCAAATCGGGCTACA" className="input-field mono"
              value={seq2} onChange={(e) => setSeq2(e.target.value.toUpperCase().replace(/[^ATCG-]/g, ''))}
              style={{ letterSpacing: '3px', fontSize: '1rem' }}
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={compareSequences}
          disabled={loading || !seq1 || !seq2}
          style={{ width: '100%', padding: '0.75rem 1.5rem' }}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" />Aligning Sequences…</> : <><Search size={16} />Compare Sequences</>}
        </button>
        {error && <div className="alert-error" style={{ marginTop: '1rem' }}><AlertCircle size={16} /> {error}</div>}
      </div>

      {result && (
        <div className="glass animate-fade-up" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Percent size={18} color="var(--accent-blue)"/> Alignment Results
            <span style={{ marginLeft: 'auto', background: 'var(--gradient-success)', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.85rem', color: 'black', fontWeight: 800 }}>
              {result.similarity_percent}% Match
            </span>
          </h3>

          {}
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Optimal Alignment Map</div>

            <div style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '4px', fontSize: '1.1rem', lineHeight: '1.8', whiteSpace: 'pre' }}>
              <div style={{ color: 'var(--text-secondary)' }}>{result.alignment_seq1}</div>
              <div>
                {result.alignment_match.split('').map((char, i) => (
                  <span key={i} style={{ color: getMatchColor(char) }}>{char}</span>
                ))}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>{result.alignment_seq2}</div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{result.matches}</span> Matches</div>
              <div style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{result.mismatches}</span> Mismatches</div>
              <div style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{result.gaps}</span> Gaps</div>
            </div>
          </div>

          {}
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Comparative Biochemical Analysis</h4>
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Sequence A</th>
                  <th>Sequence B</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Melting Temp (Tm)</td>
                  <td>{result.seq1_tm}°C</td>
                  <td>{result.seq2_tm}°C</td>
                  <td style={{ color: result.seq2_tm === result.seq1_tm ? 'var(--text-muted)' : 'var(--accent-blue)' }}>
                    {result.seq2_tm >= result.seq1_tm ? '+' : ''}{(result.seq2_tm - result.seq1_tm).toFixed(1)}°C
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Molecular Weight</td>
                  <td>{result.seq1_mw} g/mol</td>
                  <td>{result.seq2_mw} g/mol</td>
                  <td style={{ color: result.seq2_mw === result.seq1_mw ? 'var(--text-muted)' : 'var(--accent-violet)' }}>
                    {result.seq2_mw >= result.seq1_mw ? '+' : ''}{(result.seq2_mw - result.seq1_mw).toFixed(1)} g/mol
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>GC Content</td>
                  <td>{result.seq1_gc}%</td>
                  <td>{result.seq2_gc}%</td>
                  <td style={{ color: result.seq2_gc === result.seq1_gc ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                    {result.seq2_gc >= result.seq1_gc ? '+' : ''}{(result.seq2_gc - result.seq1_gc).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
};
