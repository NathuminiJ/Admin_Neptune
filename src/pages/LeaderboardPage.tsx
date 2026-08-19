import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '../components/states';
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

  const fetchLeaderboard = useCallback(async () => {
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
      const data = await api.get<LeaderboardEntry[]>(path);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
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
        ? `No collections found for ${formatDateKey(date)}`
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
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {rankBadge(row.rank) ?? <span style={{ fontWeight: 600, fontSize: 13 }}>{row.rank}</span>}
        </span>
      ),
    },
    {
      key: 'collector',
      header: 'Collector',
      render: (row) => (
        <span className="cell-primary">
          <Avatar name={row.fullName} tone={row.rank <= 3 ? 'deep' : 'green-100'} />
          <span>
            <span className="cell-title">{row.fullName}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'totalWeightKg',
      header: 'Total Weight (kg)',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatWeight(row.totalWeightKg)}</span>
      ),
    },
    {
      key: 'totalCollections',
      header: 'Total Collections',
      render: (row) => <span>{row.totalCollections}</span>,
    },
  ];

  return (
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
              title={`No collections found for ${formatDateKey(date)}.`}
              description="Leaderboard rankings for this date will appear once collectors complete collections on that day."
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
            rowKey={(row) => row.collectorId}
          />
        </div>
      )}
    </div>
  );
}