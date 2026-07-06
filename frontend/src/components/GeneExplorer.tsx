import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dna, ArrowRight, BookOpen, Activity, Search } from 'lucide-react';

const DISEASES = [
  {
    id: 'sickle-cell',
    name: 'Sickle Cell Anemia',
    gene: 'HBB (Hemoglobin Beta)',
    description: 'A group of inherited red blood cell disorders. The mutation causes red blood cells to become hard, sticky, and look like a C-shaped farm tool called a sickle.',
    mutation: 'A to T substitution (Glu6Val)',
    sequence: 'ATGGTGCACCTGACTCCTGT',
    color: '#ff6b6b'
  },
  {
    id: 'cystic-fibrosis',
    name: 'Cystic Fibrosis',
    gene: 'CFTR',
    description: 'A genetic disorder that affects the lungs, pancreas, and other organs. It is caused by mutations in the CFTR gene, most commonly the ΔF508 deletion.',
    mutation: 'Phenylalanine deletion (ΔF508)',
    sequence: 'ATCATCTTTGGTGTTTCCTA',
    color: '#34d399'
  },
  {
    id: 'tay-sachs',
    name: 'Tay-Sachs Disease',
    gene: 'HEXA',
    description: 'A rare, inherited disorder that destroys nerve cells in the brain and spinal cord. Caused by an insertion mutation in the HEXA gene.',
    mutation: '4-base insertion (TATC)',
    sequence: 'CGTATATCCTATGCCCCTGA',
    color: '#a78bfa'
  },
  {
    id: 'huntingtons',
    name: 'Huntington\'s Disease',
    gene: 'HTT (Huntingtin)',
    description: 'A progressive brain disorder that causes uncontrolled movements, emotional problems, and loss of thinking ability. Caused by CAG trinucleotide repeat expansion.',
    mutation: 'CAG repeat expansion',
    sequence: 'CAGCAGCAGCAGCAGCAGCA',
    color: '#fbbf24'
  }
];

export const GeneExplorer: React.FC = () => {
  const navigate = useNavigate();

  const handleAnalyze = (sequence: string) => {
    navigate('/dashboard?sequence=' + sequence);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,11,24,0.9)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(79,142,247,0.1)',
        padding: '0 2rem',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '62px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #4f8ef7, #34d399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(52,211,153,0.3)',
            }}>
              <Search size={16} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.1 }}>Gene Explorer</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(120,145,180,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Discover & Analyze</div>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(79,142,247,0.1)',
              border: '1px solid rgba(79,142,247,0.3)',
              borderRadius: '9px',
              color: '#4f8ef7', cursor: 'pointer',
              padding: '0.4rem 0.9rem',
              fontSize: '0.8rem', fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(79,142,247,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(79,142,247,0.1)'; }}
          >
            Go to Dashboard <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {}
      <div style={{
        maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
            padding: '0.4rem 1rem', borderRadius: '100px',
            color: '#34d399', fontSize: '0.8rem', fontWeight: 700,
            marginBottom: '1.5rem'
          }}
        >
          <BookOpen size={14} /> Educational Hub
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #a0b9dc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Explore Genetic Diseases
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ fontSize: '1.1rem', color: 'rgba(160,185,220,0.8)', maxWidth: '600px', lineHeight: 1.6 }}
        >
          Learn about real-world genetic conditions, the genes responsible, and load their DNA sequences directly into the CRISPR AI Analyzer.
        </motion.p>
      </div>

      {}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem 4rem 2rem' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem'
        }}>
          {DISEASES.map((disease, i) => (
            <motion.div
              key={disease.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              style={{
                background: 'rgba(10,22,46,0.6)',
                border: '1px solid rgba(79,142,247,0.15)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex', flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 24px ${disease.color}15`;
                (e.currentTarget as HTMLElement).style.borderColor = `${disease.color}50`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'none';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(79,142,247,0.15)';
              }}
            >
              {}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: `${disease.color}15`, border: `1px solid ${disease.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Dna size={20} color={disease.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>{disease.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: disease.color, fontWeight: 600 }}>Gene: {disease.gene}</div>
                </div>
              </div>

              {}
              <p style={{ fontSize: '0.85rem', color: 'rgba(160,185,220,0.8)', lineHeight: 1.5, flexGrow: 1, marginBottom: '1.5rem' }}>
                {disease.description}
              </p>

              {}
              <div style={{
                background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(120,145,180,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Target Sequence</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: '#e2e8f0', letterSpacing: '0.1em' }}>
                  {disease.sequence}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(120,145,180,0.8)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Activity size={12} color={disease.color} /> {disease.mutation}
                </div>
              </div>

              {}
              <button
                onClick={() => handleAnalyze(disease.sequence)}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  background: `linear-gradient(135deg, ${disease.color}CC, ${disease.color})`,
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  transition: 'opacity 0.2s',
                  boxShadow: `0 4px 12px ${disease.color}40`
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                Analyze with CRISPR AI <ArrowRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
