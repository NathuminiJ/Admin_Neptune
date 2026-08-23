import { GraduationCap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EmptyState } from './states';
import { api } from '../lib/api';
import type { UniversityDistributionEntry, UniversityDistributionResponse } from '../types';
import { formatDateKey, localToday } from '../utils/dates';

const DONUT_COLORS = [
  '#2c8a52', // neptune green
  '#3f8fbf', // blue
  '#e0a53c', // amber
  '#7c6bb0', // violet
  '#c1352b', // red
  '#2aa198', // teal
  '#d97941', // orange
  '#84968b', // grey-green
];

interface Segment extends UniversityDistributionEntry {
  percentage: number;
  color: string;
}

export function UniversityDistributionCard() {
  const [date, setDate] = useState(localToday());
  const [segments, setSegments] = useState<Segment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchSeq = useRef(0);

  const fetchData = useCallback(async () => {
    const seq = ++fetchSeq.current;
    setLoading(true);
    setError(null);
    setSegments([]);
    setTotal(0);
    try {
      const data = await api.get<UniversityDistributionResponse | UniversityDistributionEntry[]>(
        `/admin/university-distribution?date=${date}`,
      );
      if (seq !== fetchSeq.current) return;
      const items = Array.isArray(data) ? data : (data.items ?? []);
      const sum = items.reduce((acc, item) => acc + (item.total || 0), 0);
      setTotal(sum);
      setSegments(
        items.map((item, index) => ({
          ...item,
          total: item.total || 0,
          percentage: sum > 0 ? ((item.total || 0) / sum) * 100 : 0,
          color: DONUT_COLORS[index % DONUT_COLORS.length],
        })),
      );
    } catch (err: any) {
      if (seq !== fetchSeq.current) return;
      setError(err.message || 'Failed to load university distribution');
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-head">
        <h3 className="card-title">
          <GraduationCap size={15} /> University Distribution
        </h3>
        <input
          type="date"
          className="input"
          style={{ maxWidth: 170 }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Distribution date"
        />
      </div>
      <div className="card-body">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 36 }}>
            <span className="spinner" /> <span style={{ marginLeft: 10 }}>Loading distribution…</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 28 }}>
            <p className="muted" style={{ marginBottom: 12 }}>{error}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchData}>
              Retry
            </button>
          </div>
        ) : segments.length === 0 || total === 0 ? (
          <EmptyState
            icon="inbox"
            title={`No university distribution data available for ${formatDateKey(date)}.`}
            description="Distributions appear once collections are recorded for this date."
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Donut segments={segments} total={total} size={190} thickness={26} />
            <ul className="chart-legend" style={{ flexDirection: 'column', gap: 10, minWidth: 210 }}>
              {segments.map((s) => (
                <li key={s.universityId} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span className="dot" style={{ background: s.color }} />
                  <span title={`${s.total} collection${s.total !== 1 ? 's' : ''} · ${s.percentage.toFixed(1)}%`}>
                    <span style={{ fontWeight: 600 }}>{s.universityName}</span>
                    <span className="muted" style={{ marginLeft: 8 }}>
                      {formatPercentage(s.percentage)}% · {s.total}
                    </span>
                  </span>
                </li>
              ))}
              <li className="muted" style={{ fontSize: 12 }}>
                {total} collection{total !== 1 ? 's' : ''} on {formatDateKey(date)}
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPercentage(pct: number): string {
  return Number.isInteger(pct) ? String(pct) : pct.toFixed(1);
}

function Donut({
  segments,
  total,
  size,
  thickness,
}: {
  segments: Segment[];
  total: number;
  size: number;
  thickness: number;
}) {
  const radius = (42 - thickness / 4.2) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 42 42"
      role="img"
      aria-label="University distribution donut chart"
      style={{ maxWidth: '100%', flex: 'none' }}
    >
      <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#edf1ee" strokeWidth={thickness / 2} />
      {segments.map((s) => {
        const fraction = total > 0 ? s.total / total : 0;
        const dash = `${fraction * circumference} ${circumference}`;
        const offset = -offsetAccumulator * circumference;
        offsetAccumulator += fraction;
        return (
          <circle
            key={s.universityId}
            cx="21"
            cy="21"
            r={radius}
            fill="transparent"
            stroke={s.color}
            strokeWidth={thickness / 2}
            strokeDasharray={dash}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            transform="rotate(-90 21 21)"
            style={{ transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease' }}
          >
            <title>{`${s.universityName}: ${s.total} (${formatPercentage(s.percentage)}%)`}</title>
          </circle>
        );
      })}
      <text
        x="21"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 5.6, fontWeight: 800, fill: 'var(--np-ink, #1d2721)' }}
      >
        {total}
      </text>
      <text
        x="21"
        y="25.4"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 2.6, fill: '#6b7a72', letterSpacing: 0.08 }}
      >
        COLLECTIONS
      </text>
    </svg>
  );
}
