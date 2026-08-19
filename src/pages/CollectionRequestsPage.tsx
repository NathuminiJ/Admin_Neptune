import { Eye, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
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
import { normalizeRequest } from '../lib/normalize';
import type { CollectionRequest, RequestView } from '../types';
import { localToday } from '../utils/dates';
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

const COLLECTOR_OPTIONS = [
  { value: 'ALL', label: 'All Collectors' },
  { value: 'NONE', label: 'Not linked to a collector' },
];

const RIDER_OPTIONS = [
  { value: 'ALL', label: 'All Riders' },
  { value: 'NONE', label: 'Not assigned to a rider' },
];

export function CollectionRequestsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [requests, setRequests] = useState<RequestView[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [collectorFilter, setCollectorFilter] = useState('ALL');
  const [riderFilter, setRiderFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<RequestView | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<CollectionRequest[]>('/admin/collection-requests');
      setRequests(data.map(normalizeRequest));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load collection requests');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.delete(`/admin/collection-requests/${pendingDelete.id}`);
      toast.success(`Collection request ${pendingDelete.id} permanently deleted`);
      fetchData();
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error(
          'This collection request cannot be deleted because it has related collection history.',
        );
      } else {
        toast.error(err.message || 'Failed to delete collection request');
      }
    }
    setPendingDelete(null);
  };

  const collectorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of requests) {
      if (r.collector) map.set(r.collector.id, r.collector.fullName);
    }
    return [
      ...COLLECTOR_OPTIONS,
      ...[...map.entries()].map(([value, label]) => ({ value, label })),
    ];
  }, [requests]);

  const riderOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of requests) {
      if (r.rider) map.set(r.rider.id, r.rider.fullName);
    }
    return [
      ...RIDER_OPTIONS,
      ...[...map.entries()].map(([value, label]) => ({ value, label })),
    ];
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = localToday();
    const now = new Date();
    return [...requests]
      .filter((r) => {
        const requestedKey = r.requestedAt ? r.requestedAt.slice(0, 10) : '';
        const collectorName = r.collector?.fullName ?? '';
        const riderName = r.rider?.fullName ?? '';
        const matchesSearch =
          !q ||
          r.id.toLowerCase().includes(q) ||
          collectorName.toLowerCase().includes(q) ||
          riderName.toLowerCase().includes(q);
        const matchesStatus = status === 'ALL' || r.status === status;
        const matchesCollector =
          collectorFilter === 'ALL' ||
          (collectorFilter === 'NONE'
            ? !r.collector
            : r.collector?.id === collectorFilter);
        const matchesRider =
          riderFilter === 'ALL' ||
          (riderFilter === 'NONE' ? !r.rider : r.rider?.id === riderFilter);

        let matchesDate = true;
        if (dateFilter === 'TODAY') {
          matchesDate = requestedKey === today;
        } else if (dateFilter === 'WEEK') {
          const created = r.requestedAt ? new Date(r.requestedAt).getTime() : NaN;
          matchesDate = Number.isNaN(created)
            ? false
            : now.getTime() - created <= 7 * 24 * 3600 * 1000;
        } else if (dateFilter === 'MONTH') {
          const created = r.requestedAt ? new Date(r.requestedAt) : null;
          matchesDate =
            created !== null &&
            created.getFullYear() === now.getFullYear() &&
            created.getMonth() === now.getMonth();
        }

        return matchesSearch && matchesStatus && matchesCollector && matchesRider && matchesDate;
      })
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, search, status, dateFilter, collectorFilter, riderFilter]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<RequestView>[] = [
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
      key: 'location',
      header: 'Location',
      render: (r: RequestView) => <span className="muted">{r.location}</span>,
    },
    {
      key: 'created',
      header: 'Created Date',
      render: (r: RequestView) => (r.requestedAt ? formatDate(r.requestedAt) : '—'),
    },
    { key: 'rider', header: 'Rider', render: (r: RequestView) => r.rider?.fullName ?? '—' },
    { key: 'status', header: 'Status', render: (r: RequestView) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      render: (r: RequestView) => (
        <span className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <IconButton label="View details" onClick={() => navigate(`/requests/${r.id}`)}>
            <Eye size={16} />
          </IconButton>
          <IconButton
            label="Delete"
            className="delete"
            onClick={() => setPendingDelete(r)}
          >
            <Trash2 size={15} />
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
          options={collectorOptions}
          onChange={(v) => {
            setCollectorFilter(v);
            setPage(1);
          }}
        />
        <FilterDropdown
          label="Rider"
          value={riderFilter}
          options={riderOptions}
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

      <ConfirmationDialog
        open={pendingDelete !== null}
        title="Delete collection request"
        message={`Are you sure you want to permanently delete collection request ${pendingDelete?.id ?? ''}? This action is permanent and cannot be undone. If the request has related collection history, the delete will be blocked.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}