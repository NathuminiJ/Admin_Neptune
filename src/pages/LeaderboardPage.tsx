import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '../components/states';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FilterDropdown } from '../components/FilterDropdown';
import { api } from '../lib/api';
import type { LeaderboardEntry } from '../types';
import { formatWeight } from '../utils/format';
import { formatDateKey, localToday } from '../utils/dates';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'This Month' },
  { value: 'date', label: 'Specific Date' },
];

/**
 * The leaderboard API has returned both bare arrays and wrapped objects at
 * different times. Accept every known shape without assuming one property:
 * [], { data: [] }, { leaderboard: [] }, { items: [] }, or any object whose
 * first array-valued property holds the rows.
 */
function extractLeaderboardRows(payload: unknown): LeaderboardEntry[] {
  const sanitize = (rows: unknown[]): LeaderboardEntry[] =>
    rows.filter((row): row is LeaderboardEntry => Boolean(row) && typeof row === 'object');

  if (Array.isArray(payload)) return sanitize(payload);

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['data', 'leaderboard', 'items'] as const) {
      if (Array.isArray(obj[key])) return sanitize(obj[key] as unknown[]);
    }
    const firstArray = Object.values(obj).find((value) => Array.isArray(value));
    if (firstArray) return sanitize(firstArray as unknown[]);
  }

  return [];
}

function rankBadge(rank: number) {
  const tones: Record<number, { bg: string; color: string; border: string }> = {
    1: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    2: { bg: '#e5e7eb', color: '#374151', border: '#d1d5db' },
    3: { bg: '#fed7aa', color: '#9a3412', border: '#fdba74' },
  };
  const t = tones[rank];
  if (!t) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 800,
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
      }}
    >
      {rank}
    </span>
  );
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('all');
  const [date, setDate] = useState('');

  const handlePeriodChange = (next: string) => {
    setPeriod(next);
    if (next === 'date' && !date) {
      setDate(localToday());
    }
  };

  const fetchSeq = useRef(0);

  const fetchLeaderboard = useCallback(async () => {
    const seq = ++fetchSeq.current;
    if (period === 'date' && !date) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setEntries([]);
    try {
      const path =
        period === 'month'
          ? '/admin/leaderboard?period=month'
          : period === 'date'
          ? `/admin/leaderboard?date=${date}`
          : '/admin/leaderboard';
      const data = await api.get<unknown>(path);
      if (seq !== fetchSeq.current) return;
      setEntries(extractLeaderboardRows(data));
    } catch (err: any) {
      if (seq !== fetchSeq.current) return;
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, [period, date]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const description = useMemo(() => {
    if (loading) return 'Loading leaderboard…';
    if (period === 'date' && !date) return 'Select a date to view the leaderboard.';
    if (entries.length === 0) {
      return period === 'date'
        ? 'No leaderboard data available for this date.'
        : 'No records found';
    }
    const ranked = `${entries.length} collector${entries.length !== 1 ? 's' : ''} ranked`;
    if (period === 'month') return `${ranked} · This Month`;
    if (period === 'date') return `${ranked} · ${formatDateKey(date)}`;
    return `${ranked} · All Time`;
  }, [loading, entries.length, period, date]);

  const columns: Column<LeaderboardEntry>[] = [
    {
      key: 'rank',
      header: 'Rank',
      width: '72px',
      render: (row) => {
        const rank = Number(row?.rank);
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Number.isFinite(rank) && rank > 0
              ? (rankBadge(rank) ?? (
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{rank}</span>
                ))
              : '—'}
          </span>
        );
      },
    },
    {
      key: 'collector',
      header: 'Collector',
      render: (row) => (
        <span className="cell-primary">
          <Avatar name={row?.fullName || 'Unknown'} tone={Number(row?.rank) <= 3 ? 'deep' : 'green-100'} />
          <span>
            <span className="cell-title">{row?.fullName || 'Unknown Collector'}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'totalWeightKg',
      header: 'Total Weight (kg)',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatWeight(Number(row?.totalWeightKg) || 0)}</span>
      ),
    },
    {
      key: 'totalCollections',
      header: 'Total Collections',
      render: (row) => <span>{Number(row?.totalCollections) || 0}</span>,
    },
  ];

  return (
    <ErrorBoundary>
      <div className="fade-in">
        <div className="page-head">
          <div>
            <p>{description}</p>
          </div>
        </div>

      <div className="toolbar">
        <FilterDropdown
          label="Period"
          value={period}
          options={PERIOD_OPTIONS}
          onChange={handlePeriodChange}
        />
        {period === 'date' && (
          <input
            type="date"
            className="input"
            style={{ maxWidth: 180 }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}
      </div>

      {loading ? (
        <div className="table-card">
          <LoadingState label="Loading leaderboard…" />
        </div>
      ) : error ? (
        <div className="table-card">
          <ErrorState
            message={error}
            onRetry={fetchLeaderboard}
          />
        </div>
      ) : entries.length === 0 ? (
        <div className="table-card">
          {period === 'date' && !date ? (
            <EmptyState
              icon="inbox"
              title="Select a date"
              description="Pick a date above to view leaderboard rankings for that specific day."
            />
          ) : period === 'date' ? (
            <EmptyState
              icon="inbox"
              title="No leaderboard data available for this date."
              description={`No collections were recorded on ${formatDateKey(date)}. Rankings for other periods are not shown while a specific date is selected.`}
            />
          ) : (
            <EmptyState
              icon="inbox"
              title="No completed collections yet"
              description="Leaderboard rankings will appear once collectors start completing collections."
            />
          )}
        </div>
      ) : (
        <div className="table-card">
          <DataTable
            columns={columns}
            rows={entries}
            rowKey={(row) => String(row?.collectorId ?? row?.rank ?? 'row')}
          />
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}