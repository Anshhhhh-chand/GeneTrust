import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight, Dna, LogOut, Search, FileDown,
  HelpCircle, Loader2, Zap, AlertCircle, Clock, Copy, Check,
  FlaskConical, Droplets, Bot, Database, X
} from 'lucide-react';
import { BatchAnalysis } from './BatchAnalysis';
import { CompareSequences } from './CompareSequences';
import { exportToPDF } from './PdfReport';
import { AIAssistant } from './AIAssistant';
import { OffTargetPanel } from './OffTargetPanel';
import { StatsTab } from './StatsTab';
import type { PredictionResult } from '../types';

const DNA_BASE_COLORS: Record<string, string> = {
  A: '#4ade80',
  T: '#60a5fa',
  C: '#f472b6',
  G: '#fbbf24',
};

const ColoredDNA: React.FC<{ sequence: string; highlightPos?: number }> = ({ sequence, highlightPos }) => (
  <span style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '3px', fontSize: '1rem' }}>
    {sequence.split('').map((base, idx) => {
      const isMutated = highlightPos !== undefined && idx + 1 === highlightPos;
      return (
        <span
          key={idx}
          style={{
            color: isMutated ? 'var(--accent-green)' : (DNA_BASE_COLORS[base] || 'var(--text-primary)'),
            fontWeight: isMutated ? 700 : 400,
            textShadow: isMutated ? '0 0 12px rgba(52,211,153,0.7)' : 'none',
          }}
        >
          {base}
        </span>
      );
    })}
  </span>
);

const EfficiencyBar: React.FC<{ original: number; optimized: number }> = ({ original, optimized }) => {
  const gain = optimized - original;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>Efficiency gain</span>
        <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>+{gain.toFixed(2)}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--bg-base)', borderRadius: '100px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${optimized}%`, background: 'var(--gradient-success)', borderRadius: '100px', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>{original.toFixed(2)}% original</span>
        <span style={{ color: 'var(--accent-green)' }}>{optimized.toFixed(2)}% optimized</span>
      </div>
    </div>
  );
};

const HistoryTab: React.FC<{ onLoaded?: (data: PredictionResult[]) => void }> = ({ onLoaded }) => {
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await axios.get(`${apiUrl}/api/predict/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
        onLoaded?.(res.data);
      } catch (err: any) {
        setError('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin text-muted" size={32} /></div>;
  if (error) return <div className="alert-error"><AlertCircle size={16} /> {error}</div>;
  if (history.length === 0) return (
    <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Clock size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
      <p>No analysis history found.</p>
    </div>
  );

  return (
    <div className="glass animate-fade-up" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <Clock size={20} color="var(--accent-violet)" />
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Analysis History</h2>
        <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{history.length} records</span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Sequence</th>
              <th>Optimized</th>
              <th>Original %</th>
              <th>New %</th>
              <th>Gain</th>
              <th>GC%</th>
              <th>Tm (°C)</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, idx) => (
              <tr key={item.id || idx}>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{item.originalSequence}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{item.editedSequence}</td>
                <td style={{ color: 'var(--text-muted)' }}>{item.originalEfficiency.toFixed(2)}%</td>
                <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{item.efficiency.toFixed(2)}%</td>
                <td><span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>+{(item.efficiency - item.originalEfficiency).toFixed(2)}%</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{item.gcContent != null ? `${item.gcContent}%` : '—'}</td>
                <td style={{ color: 'var(--text-muted)' }}>{item.meltingTemp ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'compare' | 'history' | 'stats' | 'ai'>('single');
  const [sequence, setSequence] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const seq = searchParams.get('sequence');
    if (seq) {
      setSequence(seq);

      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<PredictionResult[]>([]);

  // NCBI State
  const [showNcbiModal, setShowNcbiModal] = useState(false);
  const [ncbiGeneQuery, setNcbiGeneQuery] = useState('');
  const [ncbiLoading, setNcbiLoading] = useState(false);
  const [ncbiError, setNcbiError] = useState('');
  const [ncbiContext, setNcbiContext] = useState<any>(null);

  const [copiedRevComp, setCopiedRevComp] = useState(false);
  const [copiedRNA, setCopiedRNA] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const analyzeSequence = async () => {
    setError('');
    if (sequence.length !== 20) { setError('Sequence must be exactly 20 nucleotides long.'); return; }
    if (!/^[ATCG]+$/i.test(sequence)) { setError('Sequence must only contain A, T, C, G bases.'); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(
        `${apiUrl}/api/predict`,
        { sequence: sequence.toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
      setCopiedRevComp(false);
      setCopiedRNA(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleNcbiImport = async () => {
    if (!ncbiGeneQuery) return;
    setNcbiLoading(true);
    setNcbiError('');
    try {
      const res = await axios.get(`http://localhost:8000/api/ncbi/gene/${ncbiGeneQuery}`);
      setSequence(res.data.sequence);
      setNcbiContext(res.data);
      setShowNcbiModal(false);
      setNcbiGeneQuery('');
    } catch (err: any) {
      setNcbiError(err.response?.data?.detail || 'Failed to fetch from NCBI');
    } finally {
      setNcbiLoading(false);
    }
  };

  const seqValid = sequence.length === 20 && /^[ATCG]+$/i.test(sequence);

  const getReverseComplement = (seq: string) => {
    const complement: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' };
    return seq.split('').reverse().map(base => complement[base]).join('');
  };
  const getRNA = (seq: string) => seq.replace(/T/g, 'U');

  const copyToClipboard = (text: string, type: 'revcomp' | 'rna') => {
    navigator.clipboard.writeText(text);
    if (type === 'revcomp') { setCopiedRevComp(true); setTimeout(() => setCopiedRevComp(false), 2000); }
    if (type === 'rna') { setCopiedRNA(true); setTimeout(() => setCopiedRNA(false), 2000); }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,11,24,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)', padding: '0 2rem',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow-blue)',
            }}>
              <Dna size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>GeneTrust</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => setActiveTab('ai')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={16} /> AI Assistant
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/explore')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Search size={14} /> Gene Explorer
            </button>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-blue"><Zap size={11} /> AI Analysis</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-blue) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sequence Intelligence
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '550px' }}>
            Submit a 20-bp CRISPR guide RNA sequence to receive AI-powered mutation recommendations, specificity analysis, and biochemical properties.
          </p>
        </div>

        {}
        <div style={{
          display: 'flex', gap: '0', marginBottom: '2rem', background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '4px',
          flexWrap: 'wrap',
        }}>
          {(['single', 'batch', 'compare', 'history', 'stats', 'ai'] as const).map(tab => (
            <button
              key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--gradient-primary)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                border: 'none', borderRadius: '10px', padding: '0.55rem 1.1rem',
                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'var(--transition-default)',
                boxShadow: activeTab === tab ? '0 2px 10px rgba(79,142,247,0.35)' : 'none',
              }}
            >
              {tab === 'single' ? '🔬 Single'
                : tab === 'batch' ? '📊 Batch'
                : tab === 'compare' ? '🧬 Compare'
                : tab === 'history' ? '⏱️ History'
                : tab === 'stats' ? '📈 Stats'
                : '🤖 AI Chat'}
            </button>
          ))}
        </div>

        {activeTab === 'single' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {}
            <div className="glass" style={{ padding: '2rem', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Search size={20} color="var(--accent-blue)" />
                  <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Sequence Input</h2>
                </div>
                <button
                  onClick={() => setShowNcbiModal(true)}
                  style={{
                    background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                    color: '#34d399', padding: '0.4rem 0.8rem', borderRadius: '8px',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  <Database size={14} /> Import from NCBI
                </button>
              </div>
              <p style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Enter a 20-nucleotide DNA sequence using only A, T, C, G characters.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text" placeholder="e.g. CTACTTCAAATGGGGCTACA" className="input-field mono"
                    value={sequence} onChange={(e) => setSequence(e.target.value.toUpperCase().replace(/[^ATCG]/g, ''))}
                    maxLength={20} style={{ letterSpacing: '3px', fontSize: '1rem' }}
                    onKeyDown={e => e.key === 'Enter' && analyzeSequence()}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Length:</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: sequence.length === 0 ? 'var(--text-muted)' : seqValid ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {sequence.length}/20 {seqValid ? '✓' : sequence.length > 0 ? '✗' : ''}
                    </span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={analyzeSequence} disabled={loading || !seqValid} style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" />Analyzing…</> : <><Search size={16} />Analyze</>}
                </button>
              </div>
              {error && <div className="alert-error" style={{ marginTop: '1rem' }}><AlertCircle size={16} /> {error}</div>}
            </div>

            {}
            {result && (
              <div className="glass animate-fade-up" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', margin: 0, marginBottom: '0.25rem' }}>Analysis Results</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{result.message}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {}
                    <button className="btn btn-ghost" onClick={() => copyToClipboard(getReverseComplement(result.editedSequence), 'revcomp')} style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>
                      {copiedRevComp ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />} Rev Comp
                    </button>
                    <button className="btn btn-ghost" onClick={() => copyToClipboard(getRNA(result.editedSequence), 'rna')} style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>
                      {copiedRNA ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />} RNA
                    </button>
                    <button className="btn btn-ghost" onClick={() => exportToPDF(result)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.75rem', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)' }}>
                      <FileDown size={14} /> PDF
                    </button>
                  </div>
                </div>

                {}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1.75rem' }}>
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Original Sequence</div>
                    <ColoredDNA sequence={result.originalSequence} />
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Efficiency: <strong style={{ color: 'var(--text-secondary)' }}>{result.originalEfficiency.toFixed(2)}%</strong></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-blue)' }}>
                      <ArrowRight size={18} color="white" />
                    </div>
                  </div>
                  <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', boxShadow: '0 0 20px rgba(52,211,153,0.08)' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-green)', marginBottom: '0.75rem' }}>Optimal Mutation</div>
                    <ColoredDNA sequence={result.editedSequence} highlightPos={result.changedPosition} />
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Efficiency: <strong style={{ color: 'var(--accent-green)' }}>{result.efficiency.toFixed(2)}%</strong></div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <EfficiencyBar original={result.originalEfficiency} optimized={result.efficiency} />
                </div>

                {}
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Biochemical Properties</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="metric-chip">
                    <div className="label"><FlaskConical size={12} style={{ display: 'inline', marginRight: '4px' }}/> Melting Temp (Tm)</div>
                    <div className="value">{result.meltingTemp ?? '—'}°C</div>
                  </div>
                  <div className="metric-chip">
                    <div className="label"><Droplets size={12} style={{ display: 'inline', marginRight: '4px' }}/> Mol. Weight</div>
                    <div className="value">{result.molecularWeight ?? '—'} g/mol</div>
                  </div>
                  <div className="metric-chip">
                    <div className="label">GC Content</div>
                    <div className="value">{result.gcContent}%</div>
                  </div>
                </div>

                {result.explanation && (
                  <div style={{ padding: '1.25rem', background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.2)', borderLeft: '3px solid var(--accent-blue)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <HelpCircle size={16} color="var(--accent-blue)" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent-blue)' }}>Why this mutation?</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                      {result.explanation}
                    </p>
                  </div>
                )}

                {}
                <OffTargetPanel sequence={result.originalSequence} />
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === 'single' && (
          <div style={{ marginTop: '1.5rem' }}>
            <AIAssistant predictionContext={result} ncbiContext={ncbiContext} />
          </div>
        )}

        {activeTab === 'batch' && <BatchAnalysis />}
        {activeTab === 'compare' && <CompareSequences />}
        {activeTab === 'history' && <HistoryTab onLoaded={setHistory} />}
        {activeTab === 'stats' && <StatsTab history={history} />}
        {activeTab === 'ai' && (
          <div style={{ maxWidth: '760px' }}>
            <AIAssistant predictionContext={result} ncbiContext={ncbiContext} />
          </div>
        )}
      </div>

      {}
      {showNcbiModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)',
            padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowNcbiModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="#34d399" /> NCBI Import
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Enter a human gene name (e.g. BRCA1, TP53, HBB) to fetch a live 20-mer sequence from the NCBI genome database.
            </p>
            <input
              type="text"
              placeholder="Gene name..."
              value={ncbiGeneQuery}
              onChange={e => setNcbiGeneQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', marginBottom: '1rem'
              }}
              onKeyDown={e => e.key === 'Enter' && handleNcbiImport()}
            />
            {ncbiError && (
              <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {ncbiError}
              </div>
            )}
            <button
              onClick={handleNcbiImport}
              disabled={ncbiLoading || !ncbiGeneQuery}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: ncbiLoading ? 'rgba(52,211,153,0.5)' : '#34d399',
                color: 'var(--bg-primary)', fontWeight: 700, border: 'none',
                cursor: ncbiLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
            >
              {ncbiLoading ? <Loader2 className="spin" size={16} /> : <Search size={16} />}
              {ncbiLoading ? 'Fetching from NCBI...' : 'Fetch Sequence'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
