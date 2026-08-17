import { Bike, Eye, Pencil, Plus, Power } from 'lucide-react';
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
import { TukIcon } from '../components/icons';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { Rider } from '../types';
import { RiderFormModal } from './RiderFormModal';
import type { RiderFormValues } from './RiderFormModal';

const PAGE_SIZE = 5;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Vehicles' },
  { value: 'TUK', label: 'Tuk (Three-Wheeler)' },
  { value: 'BIKE', label: 'Bike (Motorcycle)' },
];

function VehicleCell({ rider }: { rider: Rider }) {
  const Icon = rider.vehicleType === 'BIKE' ? Bike : TukIcon;
  return (
    <span className="cell-primary">
      <span className="oct-icon small octagonal oct-light">
        <Icon />
      </span>
      <span>
        <span className="cell-title">{rider.vehicleType === 'TUK' ? 'Tuk' : 'Bike'}</span>
        <div className="cell-sub mono">{rider.vehicleNumber}</div>
      </span>
    </span>
  );
}

export function RidersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [vehicleType, setVehicleType] = useState('ALL');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Rider | null>(null);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Rider[]>('/admin/riders');
      setRiders(data);
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
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.mobile.replace(/[^\d]/g, '').includes(q.replace(/[^\d]/g, ''));
      const matchesStatus = status === 'ALL' || r.status === status;
      const matchesType = vehicleType === 'ALL' || r.vehicleType === vehicleType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [riders, search, status, vehicleType]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (values: RiderFormValues) => {
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

  const openEdit = (r: Rider) => {
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

  const columns: Column<Rider>[] = [
    {
      key: 'name',
      header: 'Rider',
      render: (r: Rider) => (
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
      render: (r: Rider) => <span className="mono">{r.loginId}</span>,
    },
    { key: 'nic', header: 'NIC', render: (r: Rider) => <span className="mono">{r.nic}</span> },
    { key: 'mobile', header: 'Mobile', render: (r: Rider) => r.mobile },
    { key: 'status', header: 'Status', render: (r: Rider) => <StatusBadge status={r.status} /> },
    { key: 'vehicle', header: 'Assigned Vehicle', render: (r: Rider) => <VehicleCell rider={r} /> },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      render: (r: Rider) => (
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
        </span>
      ),
    },
  ];

  const hasFilters = Boolean(search) || status !== 'ALL' || vehicleType !== 'ALL';

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
          placeholder="Search name, login ID, NIC or vehicle…"
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
        <FilterDropdown
          label="Vehicle"
          value={vehicleType}
          options={TYPE_OPTIONS}
          onChange={(v) => {
            setVehicleType(v);
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
              setVehicleType('ALL');
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
    </div>
  );
}