import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Download, FileText, Loader2, CheckCircle2, AlertCircle, BarChart2 } from 'lucide-react';
import type { PredictionResult } from '../types';

export const BatchAnalysis: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<(PredictionResult & { error?: string })[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setResults([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith('.csv') || dropped.name.endsWith('.txt'))) {
      setFile(dropped);
      setError('');
      setResults([]);
    }
  };

  const processFile = async () => {
    if (!file) { setError('Please select a file first.'); return; }

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const rawLines = text.split(/\r?\n/);
      const sequences: string[] = [];

      for (const line of rawLines) {
        const parts = line.split(',');
        for (let part of parts) {
          part = part.trim().replace(/^["']|["']$/g, '').toUpperCase();
          if (part.length === 20 && /^[ATCG]+$/.test(part)) sequences.push(part);
        }
      }

      if (sequences.length === 0) throw new Error('No valid 20-character DNA sequences found.');
      if (sequences.length > 100) throw new Error('Please upload a maximum of 100 sequences per batch.');

      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const response = await axios.post(
        `${apiUrl}/api/predict/batch`,
        { sequences },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data.results);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Batch analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (results.length === 0) return;
    let csv = 'Original Sequence,Optimized Sequence,Original Efficiency (%),Optimized Efficiency (%),Mutation,GC Content (%),Error\n';
    results.forEach(res => {
      if (res.error) {
        csv += `${res.originalSequence},,,,,,,"${res.error}"\n`;
      } else {
        csv += `${res.originalSequence},${res.editedSequence},${res.originalEfficiency},${res.efficiency},Pos ${res.changedPosition}: ${res.originalBase}->${res.newBase},${res.gcContent},\n`;
      }
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genetrust_batch_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const successCount = results.filter(r => !r.error).length;
  const avgGain = results.filter(r => !r.error).reduce((acc, r) => acc + (r.efficiency - r.originalEfficiency), 0) / (successCount || 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Upload card */}
      <div className="glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <FileText size={20} color="var(--accent-violet)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Batch File Upload</h2>
          <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: '0.72rem' }}>Max 100 sequences</span>
        </div>

        <p style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Upload a <code style={{ color: 'var(--accent-cyan)', background: 'rgba(34,211,238,0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>.csv</code> or <code style={{ color: 'var(--accent-cyan)', background: 'rgba(34,211,238,0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>.txt</code> file containing 20-character DNA sequences, one per line. Mixed formats are supported.
        </p>

        {}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent-blue)' : file ? 'var(--accent-green)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'var(--transition-default)',
            background: isDragging ? 'rgba(79,142,247,0.06)' : file ? 'rgba(52,211,153,0.04)' : 'rgba(5,11,24,0.4)',
          }}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.txt" style={{ display: 'none' }} />
          <div style={{ marginBottom: '0.75rem' }}>
            {file ? (
              <CheckCircle2 size={40} color="var(--accent-green)" style={{ margin: '0 auto' }} />
            ) : (
              <Upload size={40} color={isDragging ? 'var(--accent-blue)' : 'var(--text-muted)'} style={{ margin: '0 auto' }} />
            )}
          </div>
          {file ? (
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: '0.25rem' }}>{file.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Drop file here or click to browse</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>CSV or TXT formats supported</div>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={processFile}
          disabled={!file || loading}
          style={{ width: '100%', marginTop: '1rem', padding: '0.85rem', fontSize: '0.95rem' }}
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Analyzing {file?.name}…</>
          ) : (
            <><CheckCircle2 size={18} /> Analyze Batch</>
          )}
        </button>

        {error && (
          <div className="alert-error" style={{ marginTop: '1rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      {}
      {results.length > 0 && (
        <div className="glass animate-fade-up" style={{ padding: '2rem' }}>
          {}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                <BarChart2 size={20} color="var(--accent-cyan)" />
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Results</h2>
                <span className="badge badge-green">{results.length} sequences</span>
              </div>
              <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>
                {successCount} analyzed · Avg efficiency gain: <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>+{avgGain.toFixed(2)}%</span>
              </p>
            </div>
            <button className="btn btn-success" onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <Download size={16} /> Export CSV
            </button>
          </div>

          {}
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Original Sequence</th>
                  <th>Orig %</th>
                  <th>Opt %</th>
                  <th>Gain</th>
                  <th>Mutation</th>
                  <th>GC%</th>
                </tr>
              </thead>
              <tbody>
                {results.map((res, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', fontSize: '0.8rem' }}>{res.originalSequence}</td>
                    {res.error ? (
                      <td colSpan={5} style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>⚠ {res.error}</td>
                    ) : (
                      <>
                        <td style={{ color: 'var(--text-muted)' }}>{res.originalEfficiency.toFixed(2)}%</td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{res.efficiency.toFixed(2)}%</td>
                        <td>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.8rem' }}>
                            +{(res.efficiency - res.originalEfficiency).toFixed(2)}%
                          </span>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent-red)' }}>{res.originalBase}</span>→
                            <span style={{ color: 'var(--accent-green)' }}>{res.newBase}</span>
                            {' '}@{res.changedPosition}
                          </code>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{res.gcContent ?? '—'}%</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
