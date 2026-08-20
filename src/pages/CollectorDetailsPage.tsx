import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  Phone,
  Power,
  QrCode,
  ShieldCheck,
  UserRound,
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
import { normalizeCollector, normalizeRequest } from '../lib/normalize';
import type { CollectionRequest, Collector, CollectorView, RequestView } from '../types';
import { formatDate, formatWeight } from '../utils/format';
import { CollectorFormModal } from './CollectorFormModal';
import type { CollectorPayload } from './CollectorFormModal';

export function CollectorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [collector, setCollector] = useState<CollectorView | null>(null);
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
        const [c, requests] = await Promise.all([
          api.get<Collector>(`/admin/collectors/${id}`),
          api.get<CollectionRequest[]>('/admin/collection-requests'),
        ]);
        if (cancelled) return;
        setCollector(normalizeCollector(c));
        setHistory(
          requests
            .filter((r) => r.collectorId === id)
            .map(normalizeRequest),
        );
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load collector');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/collectors')}>
          <ArrowLeft size={15} /> Back to Collectors
        </button>
        <div className="card">
          <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
            <span className="spinner" /> Loading collector…
          </div>
        </div>
      </div>
    );
  }

  if (error || !collector) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/collectors')}>
          <ArrowLeft size={15} /> Back to Collectors
        </button>
        <div className="card">
          <ErrorState
            title="Collector not found"
            message={error || `No collector exists with the ID "${id}". The record may have been removed.`}
            onRetry={() => navigate('/collectors')}
          />
        </div>
      </div>
    );
  }

  const handleSave = async (values: CollectorPayload) => {
    try {
      const updated = await api.patch<Collector>(`/admin/collectors/${collector.id}`, values);
      setCollector(normalizeCollector(updated));
      setEditOpen(false);
      toast.success(`Collector ${collector.fullName} updated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update collector');
    }
  };

  const handleToggle = async () => {
    const next = collector.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/collectors/${collector.id}/status`, { status: next });
      const fresh = await api.get<Collector>(`/admin/collectors/${collector.id}`);
      setCollector(normalizeCollector(fresh));
      setToggleOpen(false);
      toast.success(
        next === 'ACTIVE'
          ? `${collector.fullName} activated`
          : `${collector.fullName} deactivated`,
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const openRequests = history.filter(
    (r) => r.status === 'PENDING' || r.status === 'ACCEPTED',
  ).length;
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
      key: 'requested',
      header: 'Requested',
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
      <button type="button" className="back-link" onClick={() => navigate('/collectors')}>
        <ArrowLeft size={15} /> Back to Collectors
      </button>

      <div className="hero">
        <Avatar
          name={collector.fullName}
          size="lg"
          tone={collector.status === 'ACTIVE' ? 'deep' : 'green-100'}
          octagonal
        />
        <div className="hero-info">
          <h2>{collector.fullName}</h2>
          <div className="hero-meta">
            <span className="mono muted">{collector.id}</span>
            <span className="mono muted">Login: {collector.loginId}</span>
            <StatusBadge status={collector.status} />
          </div>
        </div>
        <div className="hero-actions">
          <SecondaryButton onClick={() => setEditOpen(true)}>
            <Pencil size={15} /> Edit
          </SecondaryButton>
          <PrimaryButton onClick={() => setToggleOpen(true)}>
            <Power size={15} />
            {collector.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </PrimaryButton>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <UserRound /> Personal Information
              </h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Full Name</div>
                  <div className="v">{collector.fullName}</div>
                </div>
                <div className="info-item">
                  <div className="k">Login ID</div>
                  <div className="v mono normal">{collector.loginId}</div>
                </div>
                <div className="info-item">
                  <div className="k">NIC</div>
                  <div className="v mono normal">{collector.nic}</div>
                </div>
                <div className="info-item">
                  <div className="k">Registered</div>
                  <div className="v normal">{formatDate(collector.createdAt)}</div>
                </div>
                <div className="info-item span-2">
                  <div className="k">Address</div>
                  <div className="v normal">{collector.address}</div>
                </div>
                <div className="info-item">
                  <div className="k">Guardian Name</div>
                  <div className="v normal">{collector.guardianName}</div>
                </div>
                <div className="info-item">
                  <div className="k">Guardian Mobile</div>
                  <div className="v">
                    <Phone /> {collector.guardianMobile}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <Phone /> Contact Information
              </h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Mobile</div>
                  <div className="v">
                    <Phone /> {collector.mobile}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <CalendarDays /> Collection Activity
              </h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Requests</div>
                  <div className="v">{history.length} total</div>
                </div>
                <div className="info-item">
                  <div className="k">Open Requests</div>
                  <div className="v">
                    {openRequests} in progress
                  </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <StatusBadge status={collector.status} />
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {collector.status === 'ACTIVE'
                    ? 'This collector can receive assignments and create collection requests.'
                    : 'This collector cannot receive assignments in the current state.'}
                </span>
              </div>
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Login ID</div>
                  <div className="v mono normal">{collector.loginId}</div>
                </div>
                <div className="info-item">
                  <div className="k">Created</div>
                  <div className="v normal">{formatDate(collector.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <QrCode /> QR Information
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div className="qr-box">
                  <div className="qr-grid">
                    <span className="qr-finder f1" />
                    <span className="qr-finder f2" />
                    <span className="qr-finder f3" />
                  </div>
                </div>
                <div>
                  <div className="k" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--np-ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    QR Token
                  </div>
                  <div className="mono" style={{ fontWeight: 800, fontSize: 14, color: 'var(--np-ink)' }}>
                    {collector.qrToken}
                  </div>
                  <p className="muted" style={{ fontSize: 12, marginTop: 8, maxWidth: 220 }}>
                    Riders verify the collector with this token when completing a collection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h3 className="card-title">
            <CalendarDays /> Collection Request History
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
                <div className="state-title">No collection requests yet</div>
                <div className="state-desc">
                  Requests created by this collector will be listed here.
                </div>
              </div>
            }
          />
        </div>
      </div>

      <CollectorFormModal
        open={editOpen}
        initial={collector}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={toggleOpen}
        title={collector.status === 'ACTIVE' ? 'Deactivate collector' : 'Activate collector'}
        message={
          collector.status === 'ACTIVE'
            ? `${collector.fullName} (${collector.loginId}) will be deactivated and will no longer receive assignments.`
            : `${collector.fullName} (${collector.loginId}) will be re-activated and can receive assignments again.`
        }
        confirmLabel={collector.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        destructive={collector.status === 'ACTIVE'}
        onConfirm={handleToggle}
        onCancel={() => setToggleOpen(false)}
      />
    </div>
  );
}