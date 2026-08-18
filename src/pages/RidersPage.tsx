import { Eye, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { EmptyState } from '../components/states';
import { FilterDropdown } from '../components/FilterDropdown';
import { IconButton, PrimaryButton } from '../components/buttons';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { normalizeRider } from '../lib/normalize';
import type { Rider, RiderView } from '../types';
import { RiderFormModal } from './RiderFormModal';
import type { RiderPayload } from './RiderFormModal';

const PAGE_SIZE = 5;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function RidersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [riders, setRiders] = useState<RiderView[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RiderView | null>(null);
  const [pendingToggle, setPendingToggle] = useState<RiderView | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RiderView | null>(null);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Rider[]>('/admin/riders');
      setRiders(data.map(normalizeRider));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return riders.filter((r) => {
      const matchesSearch =
        !q ||
        r.fullName.toLowerCase().includes(q) ||
        r.loginId.toLowerCase().includes(q) ||
        r.nic.toLowerCase().includes(q) ||
        r.mobile.replace(/[^\d]/g, '').includes(q.replace(/[^\d]/g, ''));
      const matchesStatus = status === 'ALL' || r.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [riders, search, status]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (values: RiderPayload) => {
    try {
      if (editing) {
        await api.patch(`/admin/riders/${editing.id}`, values);
        toast.success(`Rider ${editing.fullName} updated`);
      } else {
        await api.post('/admin/riders', values);
        toast.success(`Rider ${values.fullName} added`);
      }
      setFormOpen(false);
      setEditing(null);
      fetchRiders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save rider');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (r: RiderView) => {
    setEditing(r);
    setFormOpen(true);
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    const next = pendingToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/riders/${pendingToggle.id}/status`, { status: next });
      toast.success(
        next === 'ACTIVE'
          ? `${pendingToggle.fullName} activated`
          : `${pendingToggle.fullName} deactivated`,
      );
      fetchRiders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
    setPendingToggle(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.delete(`/admin/riders/${pendingDelete.id}`);
      toast.success(`Rider ${pendingDelete.fullName} permanently deleted`);
      fetchRiders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete rider');
    }
    setPendingDelete(null);
  };

  const columns: Column<RiderView>[] = [
    {
      key: 'name',
      header: 'Rider',
      render: (r: RiderView) => (
        <span className="cell-primary">
          <Avatar name={r.fullName} tone={r.status === 'ACTIVE' ? 'deep' : 'green-100'} />
          <span>
            <span className="cell-title">{r.fullName}</span>
            <div className="cell-sub mono">{r.id}</div>
          </span>
        </span>
      ),
    },
    {
      key: 'loginId',
      header: 'Login ID',
      render: (r: RiderView) => <span className="mono">{r.loginId}</span>,
    },
    { key: 'nic', header: 'NIC', render: (r: RiderView) => <span className="mono">{r.nic}</span> },
    { key: 'mobile', header: 'Mobile', render: (r: RiderView) => r.mobile },
    {
      key: 'vehicle',
      header: 'Assigned Vehicle',
      render: (r: RiderView) =>
        r.vehicleCode ? (
          <span className="mono">{r.vehicleCode}</span>
        ) : (
          <span className="muted">No Vehicle</span>
        ),
    },
    { key: 'status', header: 'Status', render: (r: RiderView) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      width: '140px',
      align: 'right',
      render: (r: RiderView) => (
        <span className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <IconButton label="View" onClick={() => navigate(`/riders/${r.id}`)}>
            <Eye size={16} />
          </IconButton>
          <IconButton label="Edit" onClick={() => openEdit(r)}>
            <Pencil size={15} />
          </IconButton>
          <IconButton
            label={r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            danger={r.status === 'ACTIVE'}
            onClick={() => setPendingToggle(r)}
          >
            <Power size={15} />
          </IconButton>
          <IconButton label="Delete" className="delete" onClick={() => setPendingDelete(r)}>
            <Trash2 size={15} />
          </IconButton>
        </span>
      ),
    },
  ];

  const hasFilters = Boolean(search) || status !== 'ALL';

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <p>{riders.length} riders registered · {filtered.length} match your filters</p>
        </div>
        <div className="page-actions">
          <PrimaryButton onClick={openCreate}>
            <Plus size={15} /> Add Rider
          </PrimaryButton>
        </div>
      </div>

      <div className="toolbar">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, login ID or NIC…"
          label="Search riders"
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
        {hasFilters && (
          <button
            type="button"
            className="reset-filter"
            onClick={() => {
              setSearch('');
              setStatus('ALL');
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
          onRowClick={(r) => navigate(`/riders/${r.id}`)}
          emptyState={
            <EmptyState
              icon="inbox"
              title="No riders found"
              description={
                hasFilters
                  ? 'No riders match the current search or filters.'
                  : 'No riders registered yet. Add the first rider to get started.'
              }
              action={
                !hasFilters ? (
                  <PrimaryButton onClick={openCreate}>
                    <Plus size={15} /> Add Rider
                  </PrimaryButton>
                ) : undefined
              }
            />
          }
        />
        {!loading && filtered.length > PAGE_SIZE && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
        )}
      </div>

      <RiderFormModal
        open={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={pendingToggle !== null}
        title={pendingToggle?.status === 'ACTIVE' ? 'Deactivate rider' : 'Activate rider'}
        message={
          pendingToggle?.status === 'ACTIVE'
            ? `${pendingToggle.fullName} (${pendingToggle.loginId}) will be deactivated and will no longer accept collection runs.`
            : `${pendingToggle?.fullName} (${pendingToggle?.loginId}) will be re-activated and can accept collection runs again.`
        }
        confirmLabel={pendingToggle?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        destructive={pendingToggle?.status === 'ACTIVE'}
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
      />

      <ConfirmationDialog
        open={pendingDelete !== null}
        title="Delete rider"
        message={`Are you sure you want to permanently delete ${pendingDelete?.fullName ?? 'this rider'} (${pendingDelete?.loginId ?? ''})? This action is permanent and cannot be undone. Deleting a rider will not remove any assigned vehicle. If the rider has related records, the delete will be blocked.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}