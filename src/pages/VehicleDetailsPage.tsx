import {
  ArrowLeft,
  Bike,
  CalendarDays,
  Pencil,
  Power,
  ShieldCheck,
  Truck,
  Weight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/states';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { StatusBadge } from '../components/StatusBadge';
import { TukIcon } from '../components/icons';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { normalizeRequest } from '../lib/normalize';
import type { CollectionRequest, RequestView, Vehicle } from '../types';
import { formatDate, formatWeight } from '../utils/format';
import { VehicleFormModal } from './VehicleFormModal';
import type { VehicleFormValues } from './VehicleFormModal';

const TYPE_LABELS: Record<string, string> = {
  TRUCK: 'Truck (Waste Truck)',
  TUK: 'Tuk (Three-Wheeler)',
  BIKE: 'Bike (Motorcycle)',
};

const TYPE_ICONS = { TRUCK: Truck, TUK: TukIcon, BIKE: Bike } as const;

export function VehicleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<RequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [v, requests] = await Promise.all([
          api.get<Vehicle>(`/admin/vehicles/${id}`),
          api.get<CollectionRequest[]>('/admin/collection-requests'),
        ]);
        if (cancelled) return;
        setVehicle(v);
        setHistory(
          requests
            .filter((req) => req.collection?.vehicleId === id)
            .map(normalizeRequest),
        );
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load vehicle');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/vehicles')}>
          <ArrowLeft size={15} /> Back to Vehicles
        </button>
        <div className="card">
          <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
            <span className="spinner" /> Loading vehicle…
          </div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/vehicles')}>
          <ArrowLeft size={15} /> Back to Vehicles
        </button>
        <div className="card">
          <ErrorState
            title="Vehicle not found"
            message={error || `No vehicle exists with the ID "${id}". The record may have been removed.`}
            onRetry={() => navigate('/vehicles')}
          />
        </div>
      </div>
    );
  }

  const VehicleIcon = TYPE_ICONS[vehicle.vehicleType as keyof typeof TYPE_ICONS] ?? Truck;

  const handleSave = async (values: VehicleFormValues) => {
    try {
      const updated = await api.patch<Vehicle>(`/admin/vehicles/${vehicle.id}`, values);
      setVehicle(updated);
      setEditOpen(false);
      toast.success(`Vehicle ${vehicle.vehicleCode} updated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update vehicle');
    }
  };

  const handleToggle = async () => {
    const next = vehicle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/vehicles/${vehicle.id}/status`, { status: next });
      setVehicle((prev) => (prev ? { ...prev, status: next } : prev));
      setToggleOpen(false);
      toast.success(
        next === 'ACTIVE'
          ? `Vehicle ${vehicle.vehicleCode} activated`
          : `Vehicle ${vehicle.vehicleCode} deactivated`,
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const totalWeight = history.reduce(
    (sum, r) => sum + (r.collection?.weightKg ?? 0),
    0,
  );

  const historyColumns = [
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
    { key: 'location', header: 'Location', render: (r: RequestView) => r.location },
    {
      key: 'created',
      header: 'Created',
      render: (r: RequestView) => formatDate(r.requestedAt),
    },
    {
      key: 'weight',
      header: 'Weight',
      render: (r: RequestView) => (
        <span style={{ fontWeight: 600 }}>{formatWeight(r.collection?.weightKg)}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (r: RequestView) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="fade-in">
      <button type="button" className="back-link" onClick={() => navigate('/vehicles')}>
        <ArrowLeft size={15} /> Back to Vehicles
      </button>

      <div className="hero">
        <span className="hero-avatar octagonal">
          <VehicleIcon style={{ width: 28, height: 28 }} />
        </span>
        <div className="hero-info">
          <h2 className="mono" style={{ letterSpacing: '0.03em' }}>
            {vehicle.vehicleCode}
          </h2>
          <div className="hero-meta">
            <span>{TYPE_LABELS[vehicle.vehicleType] ?? vehicle.vehicleType}</span>
            <StatusBadge status={vehicle.status} />
          </div>
        </div>
        <div className="hero-actions">
          <SecondaryButton onClick={() => setEditOpen(true)}>
            <Pencil size={15} /> Edit
          </SecondaryButton>
          <PrimaryButton onClick={() => setToggleOpen(true)}>
            <Power size={15} />
            {vehicle.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </PrimaryButton>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <Truck /> Vehicle Information
              </h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Vehicle Code</div>
                  <div className="v mono normal">{vehicle.vehicleCode}</div>
                </div>
                <div className="info-item">
                  <div className="k">Vehicle Type</div>
                  <div className="v normal">{TYPE_LABELS[vehicle.vehicleType] ?? vehicle.vehicleType}</div>
                </div>
                <div className="info-item">
                  <div className="k">Created Date</div>
                  <div className="v normal">{formatDate(vehicle.createdAt)}</div>
                </div>
                <div className="info-item">
                  <div className="k">Fleet Registration ID</div>
                  <div className="v mono normal">{vehicle.id}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <ShieldCheck /> Current Status
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StatusBadge status={vehicle.status} />
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {vehicle.status === 'ACTIVE'
                    ? 'This vehicle is available for collection runs.'
                    : 'This vehicle is out of service and cannot be assigned.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <Weight /> Usage
              </h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Collections</div>
                  <div className="v">{history.length} runs</div>
                </div>
                <div className="info-item">
                  <div className="k">Total Weight</div>
                  <div className="v">
                    <Weight /> {formatWeight(totalWeight)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h3 className="card-title">
            <CalendarDays /> Collection History
            <span className="badge badge-slate" style={{ marginLeft: 4 }}>
              {history.length}
            </span>
          </h3>
          <button type="button" className="link-btn" onClick={() => navigate('/requests')}>
            View requests
          </button>
        </div>
        <div className="card-body flush">
          <DataTable
            columns={historyColumns}
            rows={history}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/requests/${r.id}`)}
            emptyState={
              <div className="state">
                <div className="state-icon octagonal">
                  <CalendarDays />
                </div>
                <div className="state-title">No collection runs yet</div>
                <div className="state-desc">
                  Requests completed with this vehicle will be listed here.
                </div>
              </div>
            }
          />
        </div>
      </div>

      <VehicleFormModal
        open={editOpen}
        initial={vehicle}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={toggleOpen}
        title={vehicle.status === 'ACTIVE' ? 'Deactivate vehicle' : 'Activate vehicle'}
        message={
          vehicle.status === 'ACTIVE'
            ? `Vehicle ${vehicle.vehicleCode} will be taken out of service.`
            : `Vehicle ${vehicle.vehicleCode} will be returned to service.`
        }
        confirmLabel={vehicle.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        destructive={vehicle.status === 'ACTIVE'}
        onConfirm={handleToggle}
        onCancel={() => setToggleOpen(false)}
      />
    </div>
  );
}