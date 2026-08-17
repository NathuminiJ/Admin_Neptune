import { Eye } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { EmptyState } from '../components/states';
import { FilterDropdown } from '../components/FilterDropdown';
import { IconButton } from '../components/buttons';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { CollectionRequest, Collector, Rider } from '../types';
import { formatDate } from '../utils/format';

const PAGE_SIZE = 6;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const DATE_OPTIONS = [
  { value: 'ALL', label: 'Any Date' },
  { value: 'TODAY', label: 'Today' },
  { value: 'WEEK', label: 'Last 7 days' },
  { value: 'MONTH', label: 'This month' },
];

export function CollectionRequestsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [collectorFilter, setCollectorFilter] = useState('ALL');
  const [riderFilter, setRiderFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rawReqs, cols, rds] = await Promise.all([
        api.get<any[]>('/admin/collection-requests'),
        api.get<Collector[]>('/admin/collectors'),
        api.get<Rider[]>('/admin/riders'),
      ]);
      const normalized: CollectionRequest[] = rawReqs.map((r) => ({
        id: r.id,
        collectorId: r.collectorId,
        riderId: r.riderId ?? null,
        vehicleId: r.collection?.vehicleId ?? null,
        location:
          r.latitude != null && r.longitude != null
            ? `${r.latitude}, ${r.longitude}`
            : '—',
        createdDate: r.requestedAt ?? r.createdAt ?? '',
        status: r.status,
        totalWeight: r.collection?.weightKg ?? null,
        collectionDate: r.completedAt ?? null,
        acceptedDate: r.acceptedAt ?? null,
        cancelledDate: r.cancelledAt ?? null,
        assignmentId: null,
      }));
      setRequests(normalized);
      setCollectors(cols);
      setRiders(rds);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load collection requests');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const collectorName = (id: string) =>
    collectors.find((c) => c.id === id)?.fullName ?? '—';
  const riderName = (id: string | null) => {
    if (id === null) return '—';
    return riders.find((r) => r.id === id)?.fullName ?? '—';
  };

  const COLLECTOR_OPTIONS = useMemo(() => [
    { value: 'ALL', label: 'All Collectors' },
    ...collectors.map((c) => ({ value: c.id, label: c.fullName })),
  ], [collectors]);

  const RIDER_OPTIONS = useMemo(() => [
    { value: 'ALL', label: 'All Riders' },
    { value: 'NONE', label: 'Not assigned to a rider' },
    ...riders.map((r) => ({ value: r.id, label: r.fullName })),
  ], [riders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    return [...requests]
      .filter((r) => {
        const matchesSearch =
          !q ||
          r.id.toLowerCase().includes(q) ||
          collectorName(r.collectorId).toLowerCase().includes(q) ||
          riderName(r.riderId).toLowerCase().includes(q);
        const matchesStatus = status === 'ALL' || r.status === status;
        const matchesCollector = collectorFilter === 'ALL' || r.collectorId === collectorFilter;
        const matchesRider =
          riderFilter === 'ALL' ||
          (riderFilter === 'NONE' ? r.riderId === null : r.riderId === riderFilter);

        const created = new Date(r.createdDate);
        let matchesDate = true;
        if (dateFilter === 'TODAY') {
          matchesDate = r.createdDate.startsWith('2026-08-16');
        } else if (dateFilter === 'WEEK') {
          matchesDate = now.getTime() - created.getTime() <= 7 * 24 * 3600 * 1000;
        } else if (dateFilter === 'MONTH') {
          matchesDate =
            created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
        }

        return matchesSearch && matchesStatus && matchesCollector && matchesRider && matchesDate;
      })
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, search, status, dateFilter, collectorFilter, riderFilter]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<CollectionRequest>[] = [
    {
      key: 'id',
      header: 'Request ID',
      render: (r: CollectionRequest) => (
        <span className="mono" style={{ fontWeight: 700 }}>
          {r.id}
        </span>
      ),
      width: '118px',
    },
    { key: 'collector', header: 'Collector', render: (r: CollectionRequest) => collectorName(r.collectorId) },
    {
      key: 'location',
      header: 'Location',
      render: (r: CollectionRequest) => <span className="muted">{r.location}</span>,
    },
    {
      key: 'created',
      header: 'Created Date',
      render: (r: CollectionRequest) => formatDate(r.createdDate),
    },
    { key: 'rider', header: 'Rider', render: (r: CollectionRequest) => riderName(r.riderId) },
    { key: 'status', header: 'Status', render: (r: CollectionRequest) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      width: '70px',
      align: 'right',
      render: (r: CollectionRequest) => (
        <span className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <IconButton label="View details" onClick={() => navigate(`/requests/${r.id}`)}>
            <Eye size={16} />
          </IconButton>
        </span>
      ),
    },
  ];

  const hasFilters =
    Boolean(search) ||
    status !== 'ALL' ||
    dateFilter !== 'ALL' ||
    collectorFilter !== 'ALL' ||
    riderFilter !== 'ALL';

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <p>{requests.length} requests · {filtered.length} match your filters</p>
        </div>
      </div>

      <div className="toolbar">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search request ID, collector or rider…"
          label="Search collection requests"
        />
        <FilterDropdown
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <FilterDropdown
          label="Date"
          value={dateFilter}
          options={DATE_OPTIONS}
          onChange={(v) => {
            setDateFilter(v);
            setPage(1);
          }}
        />
        <FilterDropdown
          label="Collector"
          value={collectorFilter}
          options={COLLECTOR_OPTIONS}
          onChange={(v) => {
            setCollectorFilter(v);
            setPage(1);
          }}
        />
        <FilterDropdown
          label="Rider"
          value={riderFilter}
          options={RIDER_OPTIONS}
          onChange={(v) => {
            setRiderFilter(v);
            setPage(1);
          }}
        />
        {hasFilters && (
          <button
            type="button"
            className="reset-filter"
            onClick={() => {
              setSearch('');
              setStatus('ALL');
              setDateFilter('ALL');
              setCollectorFilter('ALL');
              setRiderFilter('ALL');
              setPage(1);
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="table-card">
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(r) => r.id}
          loading={loading}
          onRowClick={(r) => navigate(`/requests/${r.id}`)}
          emptyState={
            <EmptyState
              icon="clipboard"
              title="No collection requests found"
              description={
                hasFilters
                  ? 'No requests match the current search or filters.'
                  : 'Collection requests submitted by collectors will appear here.'
              }
            />
          }
        />
        {!loading && filtered.length > PAGE_SIZE && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
        )}
      </div>
    </div>
  );
}