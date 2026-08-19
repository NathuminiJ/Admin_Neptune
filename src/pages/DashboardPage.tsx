import {
  BarChart3,
  ClipboardList,
  ClipboardPlus,
  Clock,
  Plus,
  Recycle,
  Trophy,
  Truck,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { StatisticCard } from '../components/StatisticCard';
import { DataTable } from '../components/DataTable';
import { OctagonalIconContainer } from '../components/OctagonalIconContainer';
import { api } from '../lib/api';
import { normalizeAssignment, normalizeRider, normalizeRequest } from '../lib/normalize';
import type {
  AssignmentView,
  CollectionRequest,
  Collector,
  CollectorView,
  DailyAssignment,
  LeaderboardEntry,
  RequestView,
  Rider,
  RiderView,
  Vehicle,
} from '../types';
import { localToday } from '../utils/dates';
import { formatDateTime, formatWeight } from '../utils/format';

const CHART_TONES: Record<string, { color: string; fill: string }> = {
  PENDING: { color: '#8a5a06', fill: '#e0a53c' },
  ACCEPTED: { color: '#155a80', fill: '#3f8fbf' },
  COMPLETED: { color: '#2c8a52', fill: '#2c8a52' },
  CANCELLED: { color: '#84968b', fill: '#b6bdb9' },
};

export function DashboardPage() {
  const navigate = useNavigate();

  const [collectors, setCollectors] = useState<CollectorView[]>([]);
  const [riders, setRiders] = useState<RiderView[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [requests, setRequests] = useState<RequestView[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all');
  const [totalCollections, setTotalCollections] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const today = localToday();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [c, r, v, a, req] = await Promise.all([
          api.get<Collector[]>('/admin/collectors'),
          api.get<Rider[]>('/admin/riders'),
          api.get<Vehicle[]>('/admin/vehicles'),
          api.get<DailyAssignment[]>('/admin/assignments'),
          api.get<CollectionRequest[]>('/admin/collection-requests'),
        ]);
        if (!cancelled) {
          setCollectors(c.map((col) => ({ ...col, loginId: col.user.loginId, status: col.user.status })));
          setRiders(r.map(normalizeRider));
          setVehicles(v);
          setAssignments(a.map(normalizeAssignment));
          setRequests(req.map(normalizeRequest));
        }
      } catch (error) {
        console.error('Dashboard API error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await api.get<{ totalCollections?: number }>('/admin/dashboard/stats');
        if (!cancelled && typeof stats.totalCollections === 'number') {
          setTotalCollections(stats.totalCollections);
        } else if (!cancelled) {
          setTotalCollections(null);
        }
      } catch {
        if (!cancelled) setTotalCollections(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path =
          leaderboardPeriod === 'month'
            ? '/admin/leaderboard?period=month'
            : '/admin/leaderboard';
        const data = await api.get<LeaderboardEntry[]>(path);
        if (!cancelled) setLeaderboard(data.slice(0, 5));
      } catch {
        if (!cancelled) setLeaderboard([]);
      }
    })();
    return () => { cancelled = true; };
  }, [leaderboardPeriod]);

  const requestStats = useMemo(() => {
    const counts: Record<string, number> = { PENDING: 0, ACCEPTED: 0, COMPLETED: 0, CANCELLED: 0 };
    for (const r of requests) counts[r.status] = (counts[r.status] || 0) + 1;
    return counts as { PENDING: number; ACCEPTED: number; COMPLETED: number; CANCELLED: number };
  }, [requests]);

  const totalRequests = requests.length;

  const stats = useMemo(
    () => ({
      collectors: collectors.filter((c) => c.status === 'ACTIVE').length,
      riders: riders.filter((r) => r.status === 'ACTIVE').length,
      vehicles: vehicles.filter((v) => v.status === 'ACTIVE').length,
      pending: requestStats.PENDING,
    }),
    [collectors, riders, vehicles, requestStats],
  );

  const todayAssignments = useMemo(
    () => assignments.filter((a) => a.assignmentDate === today),
    [assignments, today],
  );

  const recentRequests = useMemo(
    () =>
      [...requests]
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
        .slice(0, 5),
    [requests],
  );

  if (loading) {
    return (
      <div className="fade-in dash">
        <div className="page-head">
          <div><p>Loading dashboard…</p></div>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
            <span className="spinner" /> Loading data…
          </div>
        </div>
      </div>
    );
  }

  const activityColumns = [
    {
      key: 'id',
      header: 'Request ID',
      render: (r: RequestView) => (
        <span className="mono" style={{ fontWeight: 700 }}>
          {r.id}
        </span>
      ),
      width: '118px',
    },
    {
      key: 'collector',
      header: 'Collector',
      render: (r: RequestView) => r.collector?.fullName ?? '—',
    },
    {
      key: 'weight',
      header: 'Weight',
      render: (r: RequestView) => (
        <span style={{ fontWeight: 600 }}>{formatWeight(r.collection?.weightKg)}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (r: RequestView) => <StatusBadge status={r.status} /> },
    {
      key: 'date',
      header: 'Date',
      render: (r: RequestView) => (r.requestedAt ? formatDateTime(r.requestedAt) : '—'),
    },
  ];

  return (
    <div className="fade-in dash">
      <div className="page-head">
        <div>
          <p>Welcome back — here is today's collection activity at a glance.</p>
        </div>
      </div>

      {/* Top statistics */}
      <div className="stat-grid">
        <StatisticCard
          label="Total Collectors"
          value={stats.collectors}
          icon={Users}
          tone="green"
          hint={`of ${collectors.length} registered`}
          hintTone="up"
        />
        <StatisticCard
          label="Total Riders"
          value={stats.riders}
          icon={UserCheck}
          tone="blue"
          hint={`of ${riders.length} registered`}
          hintTone="up"
        />
        <StatisticCard
          label="Active Vehicles"
          value={stats.vehicles}
          icon={Truck}
          tone="deep"
          hint={`of ${vehicles.length} fleet`}
          hintTone="flat"
        />
        <StatisticCard
          label="Pending Requests"
          value={stats.pending}
          icon={Clock}
          tone="amber"
          hint="needs action"
          hintTone="down"
        />
        <StatisticCard
          label="Total Collections"
          value={totalCollections === null ? '—' : totalCollections}
          icon={Recycle}
          tone="slate"
          hint={totalCollections === null ? 'statistics unavailable' : 'all recorded'}
          hintTone={totalCollections === null ? 'down' : 'flat'}
        />
      </div>

      {/* A. Request overview + B. Today's assignments */}
      <div className="dash-grid-2">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Collection Request Overview</h3>
          </div>
          <div className="card-body">
            <div className="stacked-bar" aria-hidden="true">
              {(['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
                <span
                  key={s}
                  style={{
                    width: `${totalRequests ? (requestStats[s] / totalRequests) * 100 : 0}%`,
                    background: CHART_TONES[s].fill,
                  }}
                />
              ))}
            </div>
            <div className="chart-legend" style={{ marginBottom: 0 }}>
              {(['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
                <span key={s}>
                  <span className="dot" style={{ background: CHART_TONES[s].fill }} />
                  {s.charAt(0) + s.slice(1).toLowerCase()} · {requestStats[s]}
                </span>
              ))}
              <span style={{ marginLeft: 'auto' }}>{totalRequests} total</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Today's Assignments</h3>
            <button type="button" className="link-btn" onClick={() => navigate('/assignments')}>
              Manage
            </button>
          </div>
          <div className="card-body flush">
            <div className="activity-list">
              {todayAssignments.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center' }} className="muted">
                  No assignments scheduled for today.
                </div>
              )}
              {todayAssignments.map((a) => (
                <div
                  key={a.id}
                  className="activity-item clickable"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/assignments/${a.id}`)}
                >
                  <OctagonalIconContainer tone="light" small>
                    <ClipboardPlus />
                  </OctagonalIconContainer>
                  <div style={{ minWidth: 0 }}>
                    <span className="activity-action">
                      {a.collectorName || '—'}
                      <span className="mono muted" style={{ marginLeft: 6, fontSize: 11.5 }}>
                        {a.id}
                      </span>
                    </span>
                    <span className="activity-detail">Daily assignment</span>
                  </div>
                  <span style={{ marginLeft: 'auto' }}>
                    <span className="mono muted" style={{ fontSize: 12 }}>
                      {a.assignmentDate}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* C. Collection activity + D. Recent activity */}
      <div className="dash-grid-2">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Collection Activity</h3>
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/requests')}
            >
              View all
            </button>
          </div>
          <div className="card-body flush">
            <DataTable
              columns={activityColumns}
              rows={recentRequests}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`/requests/${r.id}`)}
              emptyState={
                <div className="state">
                  <div className="state-icon octagonal">
                    <ClipboardList />
                  </div>
                  <div className="state-title">No activity yet</div>
                  <div className="state-desc">Collection requests will appear here.</div>
                </div>
              }
            />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="card-body flush">
            <div className="activity-list">
              <div className="activity-item">
                <div style={{ padding: 20, textAlign: 'center', width: '100%' }} className="muted">
                  Activity feed is not available from the current API.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collector Leaderboard */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3 className="card-title">
            <Trophy size={15} /> Collector Leaderboard
          </h3>
          <span style={{ display: 'flex', gap: 6 }}>
            {(['all', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`btn btn-sm ${leaderboardPeriod === p ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLeaderboardPeriod(p)}
              >
                {p === 'all' ? 'All Time' : 'This Month'}
              </button>
            ))}
          </span>
        </div>
        <div className="card-body flush">
          {leaderboard.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center' }} className="muted">
              No completed collections yet.
            </div>
          ) : (
            <div className="activity-list">
              {leaderboard.map((entry) => (
                <div key={entry.collectorId} className="activity-item">
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      flex: 'none',
                      ...(entry.rank === 1
                        ? { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
                        : entry.rank === 2
                        ? { background: '#e5e7eb', color: '#374151', border: '1px solid #d1d5db' }
                        : entry.rank === 3
                        ? { background: '#fed7aa', color: '#9a3412', border: '1px solid #fdba74' }
                        : { background: 'var(--np-green-50)', color: 'var(--np-ink-2)', border: '1px solid var(--np-line)' }),
                    }}
                  >
                    {entry.rank}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span className="activity-action">{entry.fullName}</span>
                  </div>
                  <span style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <span style={{ fontWeight: 600 }}>{formatWeight(entry.totalWeightKg)}</span>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
                      {entry.totalCollections}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* E. Quick actions */}
      <div className="card qa-strip">
        <div className="card-head">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="qa-grid">
            <button
              type="button"
              className="qa-btn"
              onClick={() => navigate('/collectors?new=1')}
            >
              <OctagonalIconContainer tone="green" small>
                <UserPlus />
              </OctagonalIconContainer>
              <span>
                <span className="qa-label">Add Collector</span>
                <div className="qa-sub">Register collection staff</div>
              </span>
            </button>
            <button
              type="button"
              className="qa-btn"
              onClick={() => navigate('/riders?new=1')}
            >
              <OctagonalIconContainer tone="blue" small>
                <UserPlus />
              </OctagonalIconContainer>
              <span>
                <span className="qa-label">Add Rider</span>
                <div className="qa-sub">Register a rider</div>
              </span>
            </button>
            <button
              type="button"
              className="qa-btn"
              onClick={() => navigate('/vehicles?new=1')}
            >
              <OctagonalIconContainer tone="deep" small>
                <Plus />
              </OctagonalIconContainer>
              <span>
                <span className="qa-label">Add Vehicle</span>
                <div className="qa-sub">Add a truck, tuk or bike</div>
              </span>
            </button>
            <button
              type="button"
              className="qa-btn"
              onClick={() => navigate('/assignments?new=1')}
            >
              <OctagonalIconContainer tone="amber" small>
                <ClipboardPlus />
              </OctagonalIconContainer>
              <span>
                <span className="qa-label">Create Assignment</span>
                <div className="qa-sub">Plan a daily route</div>
              </span>
            </button>
            <button
              type="button"
              className="qa-btn"
              onClick={() => navigate('/reports')}
            >
              <OctagonalIconContainer tone="slate" small>
                <BarChart3 />
              </OctagonalIconContainer>
              <span>
                <span className="qa-label">View Reports</span>
                <div className="qa-sub">Generate operational reports</div>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}