import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/states';
import { SecondaryButton } from '../components/buttons';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { normalizeAssignment, normalizeCollector, normalizeRequest } from '../lib/normalize';
import type {
  AssignmentView,
  CollectionRequest,
  Collector,
  CollectorView,
  DailyAssignment,
  RequestView,
} from '../types';
import { formatDate, formatDateTime, formatWeight } from '../utils/format';
import { formatDateKey } from '../utils/dates';
import { AssignmentFormModal } from './AssignmentFormModal';
import type { AssignmentFormValues } from './AssignmentFormModal';

export function AssignmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [assignment, setAssignment] = useState<AssignmentView | null>(null);
  const [collectors, setCollectors] = useState<CollectorView[]>([]);
  const [assigneeRequests, setAssigneeRequests] = useState<RequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async (): Promise<string | null> => {
    try {
      const [a, allCollectors, allRequests] = await Promise.all([
        api.get<DailyAssignment>(`/admin/assignments/${id}`),
        api.get<Collector[]>('/admin/collectors'),
        api.get<CollectionRequest[]>('/admin/collection-requests'),
      ]);
      setAssignment(normalizeAssignment(a));
      setCollectors(allCollectors.map(normalizeCollector));
      setAssigneeRequests(
        allRequests
          .filter((r) => r.collectorId === a.collectorId)
          .map(normalizeRequest),
      );
      return null;
    } catch (err: any) {
      return err.message || 'Failed to load assignment';
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const message = await load();
      if (!cancelled) setError(message);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, load]);

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
      const message = await load();
      if (message) throw new Error(message);
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
            <span>{formatDateKey(assignment.assignmentDate)}</span>
            <span className="muted">·</span>
            <span>{assignment.collectorName || '—'}</span>
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
                  <div className="v normal">{formatDateKey(assignment.assignmentDate)}</div>
                </div>
                <div className="info-item">
                  <div className="k">Created</div>
                  <div className="v normal">{formatDateTime(assignment.createdAt)}</div>
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
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Name</div>
                  <div className="v normal">{assignment.collectorName || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="k">Mobile</div>
                  <div className="v">
                    <Phone /> {assignment.collectorMobile || '—'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="k">Login ID</div>
                  <div className="v mono normal">{assignment.collectorLoginId || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <ClipboardList /> Relationship
              </h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-item">
                  <div className="k">Collector ID</div>
                  <div className="v mono normal">{assignment.collectorId}</div>
                </div>
                <div className="info-item">
                  <div className="k">Collector Status</div>
                  <div className="v">
                    {(() => {
                      const c = collectors.find((col) => col.id === assignment.collectorId);
                      return c ? <StatusBadge status={c.status} /> : <span className="muted">—</span>;
                    })()}
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
            <ClipboardList /> Collector&apos;s Requests
            <span className="badge badge-slate" style={{ marginLeft: 4 }}>
              {assigneeRequests.length}
            </span>
          </h3>
          <button type="button" className="link-btn" onClick={() => navigate('/requests')}>
            View all requests
          </button>
        </div>
        <div className="card-body flush">
          <DataTable
            columns={requestColumns}
            rows={assigneeRequests}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/requests/${r.id}`)}
            emptyState={
              <div className="state">
                <div className="state-icon octagonal">
                  <ClipboardList />
                </div>
                <div className="state-title">No linked requests</div>
                <div className="state-desc">
                  Collection requests made by this collector will appear here.
                </div>
              </div>
            }
          />
        </div>
      </div>

      <AssignmentFormModal
        open={editOpen}
        initial={{
          id: assignment.id,
          collectorId: assignment.collectorId,
          assignmentDate: assignment.assignmentDate,
          createdAt: assignment.createdAt,
          updatedAt: assignment.createdAt,
          collector: null,
        }}
        collectors={collectors}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={deleteOpen}
        title="Delete assignment"
        message={`Assignment ${assignment.id} will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}