import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  Phone,
  Power,
  ShieldCheck,
  UserCog,
  Weight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/states';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { normalizeRequest, normalizeRider } from '../lib/normalize';
import type { CollectionRequest, Rider, RequestView, RiderView } from '../types';
import { formatDate, formatWeight } from '../utils/format';
import { RiderFormModal } from './RiderFormModal';
import type { RiderPayload } from './RiderFormModal';

export function RiderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [rider, setRider] = useState<RiderView | null>(null);
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
        const [r, requests] = await Promise.all([
          api.get<Rider>(`/admin/riders/${id}`),
          api.get<CollectionRequest[]>('/admin/collection-requests'),
        ]);
        if (cancelled) return;
        setRider(normalizeRider(r));
        setHistory(
          requests
            .filter((req) => req.riderId === id)
            .map(normalizeRequest),
        );
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load rider');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/riders')}>
          <ArrowLeft size={15} /> Back to Riders
        </button>
        <div className="card">
          <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
            <span className="spinner" /> Loading rider…
          </div>
        </div>
      </div>
    );
  }

  if (error || !rider) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/riders')}>
          <ArrowLeft size={15} /> Back to Riders
        </button>
        <div className="card">
          <ErrorState
            title="Rider not found"
            message={error || `No rider exists with the ID "${id}". The record may have been removed.`}
            onRetry={() => navigate('/riders')}
          />
        </div>
      </div>
    );
  }

  const handleSave = async (values: RiderPayload) => {
    try {
      const updated = await api.patch<Rider>(`/admin/riders/${rider.id}`, values);
      setRider(normalizeRider(updated));
      setEditOpen(false);
      toast.success(`Rider ${rider.fullName} updated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update rider');
    }
  };

  const handleToggle = async () => {
    const next = rider.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/riders/${rider.id}/status`, { status: next });
      const fresh = await api.get<Rider>(`/admin/riders/${rider.id}`);
      setRider(normalizeRider(fresh));
      setToggleOpen(false);
      toast.success(
        next === 'ACTIVE' ? `${rider.fullName} activated` : `${rider.fullName} deactivated`,
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
      <button type="button" className="back-link" onClick={() => navigate('/riders')}>
        <ArrowLeft size={15} /> Back to Riders
      </button>

      <div className="hero">
        <Avatar
          name={rider.fullName}
          size="lg"
          tone={rider.status === 'ACTIVE' ? 'deep' : 'green-100'}
          octagonal
        />
        <div className="hero-info">
          <h2>{rider.fullName}</h2>
          <div className="hero-meta">
            <span className="mono muted">{rider.id}</span>
            <span className="mono muted">Login: {rider.loginId}</span>
            <StatusBadge status={rider.status} />
          </div>
        </div>
        <div className="hero-actions">
          <SecondaryButton onClick={() => setEditOpen(true)}>
            <Pencil size={15} /> Edit
          </SecondaryButton>
          <PrimaryButton onClick={() => setToggleOpen(true)}>
            <Power size={15} />
            {rider.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </PrimaryButton>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <UserCog /> Personal Information
              </h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Full Name</div>
                  <div className="v">{rider.fullName}</div>
                </div>
                <div className="info-item">
                  <div className="k">Login ID</div>
                  <div className="v mono normal">{rider.loginId}</div>
                </div>
                <div className="info-item">
                  <div className="k">NIC</div>
                  <div className="v mono normal">{rider.nic}</div>
                </div>
                <div className="info-item">
                  <div className="k">Registered</div>
                  <div className="v normal">{formatDate(rider.createdAt)}</div>
                </div>
                <div className="info-item span-2">
                  <div className="k">Address</div>
                  <div className="v normal">{rider.address}</div>
                </div>
                <div className="info-item">
                  <div className="k">Mobile</div>
                  <div className="v">
                    <Phone /> {rider.mobile}
                  </div>
                </div>
                <div className="info-item">
                  <div className="k">Assigned Vehicle</div>
                  <div className="v mono normal">{rider.vehicleCode ?? 'No Vehicle'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <Weight /> Collection Activity
              </h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Runs</div>
                  <div className="v">{history.length} total</div>
                </div>
                <div className="info-item">
                  <div className="k">Collected Weight</div>
                  <div className="v">
                    <Weight /> {formatWeight(totalWeight)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <ShieldCheck /> Account Status
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <StatusBadge status={rider.status} />
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {rider.status === 'ACTIVE'
                    ? 'This rider is available for collection runs.'
                    : 'This rider is currently unavailable for collection runs.'}
                </span>
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
                <div className="state-desc">Requests handled by this rider will be listed here.</div>
              </div>
            }
          />
        </div>
      </div>

      <RiderFormModal
        open={editOpen}
        initial={rider}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={toggleOpen}
        title={rider.status === 'ACTIVE' ? 'Deactivate rider' : 'Activate rider'}
        message={
          rider.status === 'ACTIVE'
            ? `${rider.fullName} (${rider.loginId}) will be deactivated and will no longer accept collection runs.`
            : `${rider.fullName} (${rider.loginId}) will be re-activated and can accept collection runs again.`
        }
        confirmLabel={rider.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        destructive={rider.status === 'ACTIVE'}
        onConfirm={handleToggle}
        onCancel={() => setToggleOpen(false)}
      />
    </div>
  );
}