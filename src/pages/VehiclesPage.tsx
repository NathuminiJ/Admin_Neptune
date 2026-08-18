import { Bike, Eye, Pencil, Plus, Power, Truck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import type { Vehicle } from '../types';
import { formatDate } from '../utils/format';
import { VehicleFormModal } from './VehicleFormModal';
import type { VehicleFormValues } from './VehicleFormModal';

const PAGE_SIZE = 6;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Types' },
  { value: 'TRUCK', label: 'Truck (Waste Truck)' },
  { value: 'TUK', label: 'Tuk (Three-Wheeler)' },
  { value: 'BIKE', label: 'Bike (Motorcycle)' },
];

const TYPE_ICONS = { TRUCK: Truck, TUK: TukIcon, BIKE: Bike } as const;

const TYPE_LABELS: Record<string, string> = {
  TRUCK: 'Truck',
  TUK: 'Tuk',
  BIKE: 'Bike',
};

function VehicleTypeCell({ vehicleType }: { vehicleType: string }) {
  const Icon = TYPE_ICONS[vehicleType as keyof typeof TYPE_ICONS] ?? Truck;
  return (
    <span className="cell-primary">
      <span className="oct-icon small octagonal oct-light">
        <Icon />
      </span>
      <span className="cell-title">{TYPE_LABELS[vehicleType] ?? vehicleType}</span>
    </span>
  );
}

export function VehiclesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [vehicleType, setVehicleType] = useState('ALL');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Vehicle | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const v = await api.get<Vehicle[]>('/admin/vehicles');
      setVehicles(v);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      const matchesSearch =
        !q ||
        v.vehicleCode.toLowerCase().includes(q) ||
        v.vehicleType.toLowerCase().includes(q);
      const matchesStatus = status === 'ALL' || v.status === status;
      const matchesType = vehicleType === 'ALL' || v.vehicleType === vehicleType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vehicles, search, status, vehicleType]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (values: VehicleFormValues) => {
    try {
      if (editing) {
        await api.patch(`/admin/vehicles/${editing.id}`, values);
        toast.success(`Vehicle ${editing.vehicleCode} updated`);
      } else {
        await api.post('/admin/vehicles', values);
        toast.success(`Vehicle ${values.vehicleCode} added`);
      }
      setFormOpen(false);
      setEditing(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vehicle');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setFormOpen(true);
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    const next = pendingToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/vehicles/${pendingToggle.id}/status`, { status: next });
      toast.success(
        next === 'ACTIVE'
          ? `Vehicle ${pendingToggle.vehicleCode} activated`
          : `Vehicle ${pendingToggle.vehicleCode} deactivated`,
      );
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
    setPendingToggle(null);
  };

  const columns: Column<Vehicle>[] = [
    {
      key: 'code',
      header: 'Vehicle Code',
      render: (v: Vehicle) => (
        <span className="mono" style={{ fontWeight: 700 }}>
          {v.vehicleCode}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Vehicle Type',
      render: (v: Vehicle) => <VehicleTypeCell vehicleType={v.vehicleType} />,
    },
    { key: 'status', header: 'Status', render: (v: Vehicle) => <StatusBadge status={v.status} /> },
    {
      key: 'created',
      header: 'Created Date',
      render: (v: Vehicle) => formatDate(v.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      render: (v: Vehicle) => (
        <span className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <IconButton label="View" onClick={() => navigate(`/vehicles/${v.id}`)}>
            <Eye size={16} />
          </IconButton>
          <IconButton label="Edit" onClick={() => openEdit(v)}>
            <Pencil size={15} />
          </IconButton>
          <IconButton
            label={v.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            danger={v.status === 'ACTIVE'}
            onClick={() => setPendingToggle(v)}
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
          <p>{vehicles.length} vehicles registered · {filtered.length} match your filters</p>
        </div>
        <div className="page-actions">
          <PrimaryButton onClick={openCreate}>
            <Plus size={15} /> Add Vehicle
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
          placeholder="Search vehicle code or type…"
          label="Search vehicles"
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
          label="Type"
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
          rowKey={(v) => v.id}
          loading={loading}
          onRowClick={(v) => navigate(`/vehicles/${v.id}`)}
          emptyState={
            <EmptyState
              icon="inbox"
              title="No vehicles found"
              description={
                hasFilters
                  ? 'No vehicles match the current search or filters.'
                  : 'No vehicles registered yet. Add the first vehicle to get started.'
              }
              action={
                !hasFilters ? (
                  <PrimaryButton onClick={openCreate}>
                    <Plus size={15} /> Add Vehicle
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

      <VehicleFormModal
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
        title={pendingToggle?.status === 'ACTIVE' ? 'Deactivate vehicle' : 'Activate vehicle'}
        message={
          pendingToggle?.status === 'ACTIVE'
            ? `Vehicle ${pendingToggle.vehicleCode} will be taken out of service.`
            : `Vehicle ${pendingToggle?.vehicleCode} will be returned to service.`
        }
        confirmLabel={pendingToggle?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        destructive={pendingToggle?.status === 'ACTIVE'}
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}