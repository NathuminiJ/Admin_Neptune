import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  MapPin,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/states';
import { SecondaryButton } from '../components/buttons';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { CollectionRequest, Collector, DailyAssignment } from '../types';
import { formatDate, formatDateTime, formatWeight } from '../utils/format';
import { AssignmentFormModal } from './AssignmentFormModal';
import type { AssignmentFormValues } from './AssignmentFormModal';

export function AssignmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [assignment, setAssignment] = useState<DailyAssignment | null>(null);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [collector, setCollector] = useState<Collector | null>(null);
  const [linkedRequests, setLinkedRequests] = useState<CollectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [a, allCollectors, allRequests] = await Promise.all([
          api.get<DailyAssignment>(`/admin/assignments/${id}`),
          api.get<Collector[]>('/admin/collectors'),
          api.get<CollectionRequest[]>('/admin/collection-requests'),
        ]);
        if (cancelled) return;
        setAssignment(a);
        setCollectors(allCollectors);
        const c = allCollectors.find((col) => col.id === a.collectorId) ?? null;
        setCollector(c);
        setLinkedRequests(
          allRequests.filter((r) => r.assignmentId === a.id || r.collectorId === a.collectorId),
        );
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load assignment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/assignments')}>
          <ArrowLeft size={15} /> Back to Assignments
        </button>
        <div className="card">
          <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
            <span className="spinner" /> Loading assignment…
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={() => navigate('/assignments')}>
          <ArrowLeft size={15} /> Back to Assignments
        </button>
        <div className="card">
          <ErrorState
            title="Assignment not found"
            message={error || `No assignment exists with the ID "${id}". The record may have been removed.`}
            onRetry={() => navigate('/assignments')}
          />
        </div>
      </div>
    );
  }

  const handleSave = async (values: AssignmentFormValues) => {
    try {
      await api.patch(`/admin/assignments/${assignment.id}`, values);
      setAssignment((prev) => (prev ? { ...prev, ...values } : prev));
      setEditOpen(false);
      toast.success(`Assignment ${assignment.id} updated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update assignment');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/assignments/${assignment.id}`);
      toast.success(`Assignment ${assignment.id} deleted`);
      setDeleteOpen(false);
      navigate('/assignments');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete assignment');
    }
  };

  const requestColumns = [
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
    { key: 'location', header: 'Location', render: (r: CollectionRequest) => r.location },
    {
      key: 'created',
      header: 'Created',
      render: (r: CollectionRequest) => formatDate(r.createdDate),
    },
    {
      key: 'weight',
      header: 'Weight',
      render: (r: CollectionRequest) => (
        <span style={{ fontWeight: 600 }}>{formatWeight(r.totalWeight)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: CollectionRequest) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="fade-in">
      <button type="button" className="back-link" onClick={() => navigate('/assignments')}>
        <ArrowLeft size={15} /> Back to Assignments
      </button>

      <div className="hero">
        <span className="hero-avatar octagonal">
          <CalendarDays style={{ width: 26, height: 26 }} />
        </span>
        <div className="hero-info">
          <h2 className="mono" style={{ letterSpacing: '0.03em' }}>
            {assignment.id}
          </h2>
          <div className="hero-meta">
            <span>{formatDate(assignment.date)}</span>
            <span className="muted">·</span>
            <span>{assignment.area}</span>
            <StatusBadge status={assignment.status} />
          </div>
        </div>
        <div className="hero-actions">
          <SecondaryButton onClick={() => setEditOpen(true)}>
            <Pencil size={15} /> Edit
          </SecondaryButton>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <CalendarDays /> Assignment Information
              </h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Assignment ID</div>
                  <div className="v mono normal">{assignment.id}</div>
                </div>
                <div className="info-item">
                  <div className="k">Date</div>
                  <div className="v normal">{formatDate(assignment.date)}</div>
                </div>
                <div className="info-item">
                  <div className="k">Assigned Area</div>
                  <div className="v">
                    <MapPin /> {assignment.area}
                  </div>
                </div>
                <div className="info-item">
                  <div className="k">Assignment Status</div>
                  <div className="v">
                    <StatusBadge status={assignment.status} />
                  </div>
                </div>
                <div className="info-item">
                  <div className="k">Created</div>
                  <div className="v normal">{formatDateTime(assignment.createdDate)}</div>
                </div>
                <div className="info-item">
                  <div className="k">Linked Requests</div>
                  <div className="v normal">{linkedRequests.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <Phone /> Collector
              </h3>
            </div>
            <div className="card-body">
              {collector ? (
                <div className="info-list">
                  <div className="info-item">
                    <div className="k">Name</div>
                    <div className="v normal">{collector.fullName}</div>
                  </div>
                  <div className="info-item">
                    <div className="k">Mobile</div>
                    <div className="v">
                      <Phone /> {collector.mobile}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="k">Login ID</div>
                    <div className="v mono normal">{collector.loginId}</div>
                  </div>
                  <div className="info-item">
                    <div className="k">Collector Status</div>
                    <div className="v">
                      <StatusBadge status={collector.status} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13 }}>
                  Collector record not found.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Assignment Status</h3>
            </div>
            <div className="card-body">
              <div className="timeline">
                <div
                  className={`timeline-step ${assignment.status !== 'SCHEDULED' ? 'done' : 'current'}`}
                >
                  <span className="timeline-node">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="step-label">
                    Scheduled
                    {assignment.status === 'SCHEDULED' && (
                      <span className="step-badge" style={{ background: 'var(--np-amber-bg)', color: 'var(--np-amber)' }}>
                        Current
                      </span>
                    )}
                  </span>
                  <div className="step-time">Route planned for {formatDate(assignment.date)}</div>
                </div>
                <div
                  className={`timeline-step ${
                    assignment.status === 'IN_PROGRESS' || assignment.status === 'COMPLETED'
                      ? assignment.status === 'IN_PROGRESS'
                        ? 'current'
                        : 'done'
                      : ''
                  }`}
                >
                  <span className="timeline-node">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="step-label">
                    In Progress
                    {assignment.status === 'IN_PROGRESS' && (
                      <span className="step-badge" style={{ background: 'var(--np-blue-bg)', color: 'var(--np-blue)' }}>
                        Current
                      </span>
                    )}
                  </span>
                  <div className="step-time">Collector is working the assigned area</div>
                </div>
                <div className={`timeline-step ${assignment.status === 'COMPLETED' ? 'done' : ''}`}>
                  <span className="timeline-node">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="step-label">
                    Completed
                    {assignment.status === 'COMPLETED' && (
                      <span className="step-badge" style={{ background: 'var(--np-green-100)', color: 'var(--np-green-800)' }}>
                        Done
                      </span>
                    )}
                  </span>
                  <div className="step-time">All requests in this area have been collected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h3 className="card-title">
            <ClipboardList /> Collection Requests
            <span className="badge badge-slate" style={{ marginLeft: 4 }}>
              {linkedRequests.length}
            </span>
          </h3>
          <button type="button" className="link-btn" onClick={() => navigate('/requests')}>
            View all requests
          </button>
        </div>
        <div className="card-body flush">
          <DataTable
            columns={requestColumns}
            rows={linkedRequests}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/requests/${r.id}`)}
            emptyState={
              <div className="state">
                <div className="state-icon octagonal">
                  <ClipboardList />
                </div>
                <div className="state-title">No linked requests</div>
                <div className="state-desc">
                  Collection requests will appear here once they are linked to this assignment.
                </div>
              </div>
            }
          />
        </div>
      </div>

      <AssignmentFormModal
        open={editOpen}
        initial={assignment}
        collectors={collectors}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={deleteOpen}
        title="Delete assignment"
        message={`Assignment ${assignment.id} will be permanently removed. Associated collection requests are not deleted.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}