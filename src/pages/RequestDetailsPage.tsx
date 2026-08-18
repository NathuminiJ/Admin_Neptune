import {
  ArrowLeft,
  Bike,
  ClipboardList,
  MapPin,
  Phone,
  Truck,
  Weight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '../components/states';
import { StatusBadge } from '../components/StatusBadge';
import { TukIcon } from '../components/icons';
import { api } from '../lib/api';
import { normalizeRequest } from '../lib/normalize';
import type { CollectionRequest, RequestView } from '../types';
import { formatDateTime, formatWeight } from '../utils/format';

const TYPE_ICONS = { TRUCK: Truck, TUK: TukIcon, BIKE: Bike } as const;
const TYPE_LABELS: Record<string, string> = {
  TRUCK: 'Truck (Waste Truck)',
  TUK: 'Tuk (Three-Wheeler)',
  BIKE: 'Bike (Motorcycle)',
};

interface TimelineStepData {
  label: string;
  time: string | null;
  state: 'done' | 'current' | 'pending' | 'cancelled';
}

function timelineFor(request: RequestView): TimelineStepData[] {
  if (request.status === 'CANCELLED') {
    return [
      { label: 'Requested', time: request.requestedAt, state: 'done' },
      {
        label: 'Cancelled',
        time: request.cancelledAt,
        state: 'cancelled',
      },
    ];
  }
  const isCompleted = request.status === 'COMPLETED';
  const isAccepted = request.status === 'ACCEPTED' || isCompleted;
  return [
    { label: 'Requested', time: request.requestedAt, state: 'done' },
    {
      label: 'Accepted',
      time: isAccepted ? request.acceptedAt : null,
      state: isAccepted ? 'done' : 'current',
    },
    {
      label: 'Completed',
      time: isCompleted ? request.completedAt : null,
      state: isCompleted ? 'done' : 'pending',
    },
  ];
}

function TimelineMarker({ state }: { state: TimelineStepData['state'] }) {
  if (state === 'done' || state === 'cancelled') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />;
}

export function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RequestView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const req = await api.get<CollectionRequest>(`/admin/collection-requests/${id}`);
        if (!cancelled) setRequest(normalizeRequest(req));
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load request');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/requests')}>
          <ArrowLeft size={15} /> Back to Collection Requests
        </button>
        <div className="card">
          <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
            <span className="spinner" /> Loading request…
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/requests')}>
          <ArrowLeft size={15} /> Back to Collection Requests
        </button>
        <div className="card">
          <ErrorState
            title="Request not found"
            message={error || `No collection request exists with the ID "${id}". The record may have been removed.`}
            onRetry={() => navigate('/requests')}
          />
        </div>
      </div>
    );
  }

  const timeline = timelineFor(request);
  const vehicle = request.collection?.vehicle ?? null;
  const VehicleIcon = vehicle ? (TYPE_ICONS[vehicle.vehicleType as keyof typeof TYPE_ICONS] ?? Truck) : null;

  return (
    <div className="fade-in">
      <button type="button" className="back-link" onClick={() => navigate('/requests')}>
        <ArrowLeft size={15} /> Back to Collection Requests
      </button>

      <div className="hero">
        <span className="hero-avatar octagonal">
          <ClipboardList style={{ width: 26, height: 26 }} />
        </span>
        <div className="hero-info">
          <h2 className="mono" style={{ letterSpacing: '0.03em' }}>
            {request.id}
          </h2>
          <div className="hero-meta">
            <span className="muted">
              Requested {request.requestedAt ? formatDateTime(request.requestedAt) : '—'}
            </span>
            <StatusBadge status={request.status} />
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Request Information</h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Request ID</div>
                  <div className="v mono normal">{request.id}</div>
                </div>
                <div className="info-item">
                  <div className="k">Status</div>
                  <div className="v">
                    <StatusBadge status={request.status} />
                  </div>
                </div>
                <div className="info-item">
                  <div className="k">QR Verified</div>
                  <div className="v normal">
                    {request.qrVerified ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="k">Requested Date</div>
                  <div className="v normal">
                    {request.requestedAt ? formatDateTime(request.requestedAt) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Collector</h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Name</div>
                  <div className="v normal">{request.collector?.fullName ?? '—'}</div>
                </div>
                <div className="info-item">
                  <div className="k">Mobile</div>
                  <div className="v">
                    <Phone /> {request.collector?.mobile ?? '—'}
                  </div>
                </div>
                <div className="info-item span-2">
                  <div className="k">Location</div>
                  <div className="v normal">{request.location}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Rider</h3>
            </div>
            <div className="card-body">
              {request.rider ? (
                <div className="info-list">
                  <div className="info-item">
                    <div className="k">Name</div>
                    <div className="v normal">{request.rider.fullName}</div>
                  </div>
                  <div className="info-item">
                    <div className="k">Mobile</div>
                    <div className="v">
                      <Phone /> {request.rider.mobile}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13 }}>
                  No rider assigned to this request yet.
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Vehicle</h3>
            </div>
            <div className="card-body">
              {vehicle ? (
                <div className="info-list">
                  <div className="info-item">
                    <div className="k">Vehicle Code</div>
                    <div className="v mono normal">{vehicle.vehicleCode}</div>
                  </div>
                  <div className="info-item">
                    <div className="k">Vehicle Type</div>
                    <div className="v normal">
                      {VehicleIcon && <VehicleIcon style={{ width: 15, height: 15 }} />}{' '}
                      {TYPE_LABELS[vehicle.vehicleType] ?? vehicle.vehicleType}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13 }}>
                  No vehicle linked to this request yet.
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Collection</h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Total Weight</div>
                  <div className="v">
                    <Weight /> {formatWeight(request.collection?.weightKg)}
                  </div>
                </div>
                <div className="info-item">
                  <div className="k">Collection Date / Time</div>
                  <div className="v normal">
                    {request.collection?.collectedAt
                      ? formatDateTime(request.collection.collectedAt)
                      : 'Not collected yet'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Status Timeline</h3>
            </div>
            <div className="card-body">
              <div className="timeline">
                {timeline.map((step, idx) => (
                  <div
                    key={step.label}
                    className={`timeline-step ${
                      step.state === 'cancelled'
                        ? 'cancelled'
                        : step.state === 'done'
                          ? 'done'
                          : step.state === 'current'
                            ? 'current'
                            : ''
                    }`}
                  >
                    <span className="timeline-node">
                      <TimelineMarker state={step.state} />
                    </span>
                    <span className="step-label">
                      {step.label}
                      {idx === 0 && request.status === 'PENDING' && (
                        <span className="step-badge" style={{ background: 'var(--np-amber-bg)', color: 'var(--np-amber)' }}>
                          Current
                        </span>
                      )}
                    </span>
                    <div className="step-time">
                      {step.time
                        ? formatDateTime(step.time)
                        : step.state === 'pending'
                          ? 'Waiting for this stage'
                          : `Awaiting ${step.label.toLowerCase()}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <MapPin /> Location
              </h3>
            </div>
            <div className="card-body">
              <div className="map-placeholder">
                <div className="map-grid" aria-hidden="true" />
                <div className="map-road r1" aria-hidden="true" />
                <div className="map-road r2" aria-hidden="true" />
                <div className="map-pin" aria-hidden="true">
                  <MapPin />
                </div>
                <div className="map-note">
                  Coordinates {request.location}. Live map will load once the Neptune API is
                  connected.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}