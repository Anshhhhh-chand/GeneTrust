import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, Target, Dna } from 'lucide-react';
import type { PredictionResult } from '../types';

interface Props {
  history: PredictionResult[];
}

const BASE_COLORS: Record<string, string> = {
  A: '#4ade80', T: '#60a5fa', C: '#f472b6', G: '#fbbf24',
};

const BarChart: React.FC<{ data: { label: string; value: number; color?: string }[]; maxVal?: number; height?: number }> = ({
  data, maxVal, height = 80,
}) => {
  const max = maxVal ?? Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${height}px`, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{d.value}</div>
          <div style={{
            width: '100%', borderRadius: '3px 3px 0 0',
            height: `${Math.max(4, (d.value / max) * (height - 24))}px`,
            background: d.color ?? 'var(--gradient-primary)',
            transition: 'height 0.6s cubic-bezier(0.16,1,0.3,1)',
            minHeight: d.value > 0 ? '4px' : '0',
          }} />
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

const HBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
    <span style={{ minWidth: '20px', fontSize: '0.8rem', fontWeight: 700, color }}>{label}</span>
    <div style={{ flex: 1, height: '8px', background: 'var(--bg-base)', borderRadius: '100px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${(value / Math.max(max, 1)) * 100}%`,
        background: color, borderRadius: '100px',
        transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
    <span style={{ minWidth: '24px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>{value}</span>
  </div>
);

const StatCard: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode; badge?: string }> = ({ title, children, icon, badge }) => (
  <div style={{
    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)', padding: '1.25rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      {icon}
      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{title}</span>
      {badge && (
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '100px', background: 'rgba(79,142,247,0.12)', color: 'var(--accent-blue)' }}>
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

export const StatsTab: React.FC<Props> = ({ history }) => {
  const stats = useMemo(() => {
    const valid = history.filter(h => h.gcContent != null);

    const gcBuckets = [
      { label: '<30%', value: 0, color: '#60a5fa' },
      { label: '30-40', value: 0, color: '#4ade80' },
      { label: '40-50', value: 0, color: '#a78bfa' },
      { label: '50-60', value: 0, color: '#fbbf24' },
      { label: '60-70', value: 0, color: '#f97316' },
      { label: '>70%', value: 0, color: '#f87171' },
    ];
    valid.forEach(h => {
      const gc = h.gcContent!;
      if (gc < 30) gcBuckets[0].value++;
      else if (gc < 40) gcBuckets[1].value++;
      else if (gc < 50) gcBuckets[2].value++;
      else if (gc < 60) gcBuckets[3].value++;
      else if (gc < 70) gcBuckets[4].value++;
      else gcBuckets[5].value++;
    });

    const gainBuckets = [
      { label: '<0.1', value: 0, color: '#94a3b8' },
      { label: '0.1-0.5', value: 0, color: '#60a5fa' },
      { label: '0.5-1', value: 0, color: '#4ade80' },
      { label: '1-2', value: 0, color: '#fbbf24' },
      { label: '>2', value: 0, color: '#f97316' },
    ];
    history.forEach(h => {
      const gain = h.efficiency - h.originalEfficiency;
      if (gain < 0.1) gainBuckets[0].value++;
      else if (gain < 0.5) gainBuckets[1].value++;
      else if (gain < 1) gainBuckets[2].value++;
      else if (gain < 2) gainBuckets[3].value++;
      else gainBuckets[4].value++;
    });

    const positionCounts = new Array(20).fill(0);
    history.forEach(h => {
      const pos = h.changedPosition - 1;
      if (pos >= 0 && pos < 20) positionCounts[pos]++;
    });
    const maxPos = Math.max(...positionCounts, 1);

    const baseChanges: Record<string, number> = {};
    history.forEach(h => {
      if (h.originalBase && h.newBase) {
        const key = `${h.originalBase}→${h.newBase}`;
        baseChanges[key] = (baseChanges[key] || 0) + 1;
      }
    });
    const topChanges = Object.entries(baseChanges)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const avgEfficiency = history.length ? history.reduce((s, h) => s + h.efficiency, 0) / history.length : 0;
    const avgGain = history.length ? history.reduce((s, h) => s + (h.efficiency - h.originalEfficiency), 0) / history.length : 0;
    const avgGC = valid.length ? valid.reduce((s, h) => s + h.gcContent!, 0) / valid.length : 0;
    const avgTm = valid.filter(h => h.meltingTemp != null).length
      ? valid.filter(h => h.meltingTemp != null).reduce((s, h) => s + h.meltingTemp!, 0) / valid.filter(h => h.meltingTemp != null).length
      : null;

    return { gcBuckets, gainBuckets, positionCounts, maxPos, topChanges, avgEfficiency, avgGain, avgGC, avgTm };
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <BarChart2 size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
        <p>No analysis history yet. Run some sequences to see statistics here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Total Analyses', value: history.length.toString(), color: 'var(--accent-blue)' },
          { label: 'Avg Efficiency', value: `${stats.avgEfficiency.toFixed(2)}%`, color: 'var(--accent-green)' },
          { label: 'Avg Gain', value: `+${stats.avgGain.toFixed(2)}%`, color: '#f97316' },
          { label: 'Avg GC Content', value: `${stats.avgGC.toFixed(1)}%`, color: 'var(--accent-violet)' },
          ...(stats.avgTm !== null ? [{ label: 'Avg Tm', value: `${stats.avgTm.toFixed(1)}°C`, color: '#f472b6' }] : []),
        ].map((m, i) => (
          <div key={i} className="metric-chip" style={{ textAlign: 'center' }}>
            <div className="label">{m.label}</div>
            <div className="value" style={{ color: m.color, fontSize: '1.3rem' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {}
        <StatCard title="GC Content Distribution" icon={<Dna size={15} color="var(--accent-blue)" />} badge={`${history.length} seqs`}>
          <BarChart data={stats.gcBuckets} height={90} />
        </StatCard>

        {}
        <StatCard title="Efficiency Gain Distribution" icon={<TrendingUp size={15} color="var(--accent-green)" />}>
          <BarChart data={stats.gainBuckets} height={90} />
        </StatCard>
      </div>

      {}
      <StatCard title="Mutation Position Heatmap" icon={<Target size={15} color="var(--accent-violet)" />} badge="positions 1–20">
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Most frequently mutated positions across all predictions
        </div>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '60px' }}>
          {stats.positionCounts.map((count, i) => {
            const intensity = stats.maxPos > 0 ? count / stats.maxPos : 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{
                  width: '100%', borderRadius: '2px',
                  height: `${Math.max(intensity * 44, count > 0 ? 4 : 0)}px`,
                  background: `rgba(139,92,246,${0.2 + intensity * 0.8})`,
                  transition: 'height 0.5s ease',
                }} />
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{i + 1}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span>Low</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[0.2, 0.4, 0.6, 0.8, 1].map(o => (
              <div key={o} style={{ width: '12px', height: '8px', borderRadius: '1px', background: `rgba(139,92,246,${o})` }} />
            ))}
          </div>
          <span>High</span>
        </div>
      </StatCard>

      {}
      <StatCard title="Most Common Base Substitutions" icon={<BarChart2 size={15} color="#f97316" />}>
        {stats.topChanges.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No mutation data available.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
            {stats.topChanges.map(([change, count], i) => {
              const [, to] = change.split('→');
              const color = BASE_COLORS[to] ?? 'var(--accent-blue)';
              return (
                <HBar
                  key={i}
                  label={change}
                  value={count}
                  max={stats.topChanges[0][1]}
                  color={color}
                />
              );
            })}
          </div>
        )}
      </StatCard>

    </div>
  );
};
