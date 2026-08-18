import { CalendarDays, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { EmptyState } from '../components/states';
import { FilterDropdown } from '../components/FilterDropdown';
import { IconButton, PrimaryButton } from '../components/buttons';
import { Pagination } from '../components/Pagination';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { normalizeAssignment, normalizeCollector } from '../lib/normalize';
import type { AssignmentView, Collector, CollectorView, DailyAssignment } from '../types';
import { localToday } from '../utils/dates';
import { formatDateKey } from '../utils/dates';
import { AssignmentFormModal } from './AssignmentFormModal';
import type { AssignmentFormValues } from './AssignmentFormModal';

const PAGE_SIZE = 6;

const DATE_OPTIONS = [
  { value: 'ALL', label: 'Any Date' },
  { value: 'TODAY', label: 'Today' },
  { value: 'FUTURE', label: 'Upcoming' },
  { value: 'PAST', label: 'Past' },
];

export function AssignmentsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [collectors, setCollectors] = useState<CollectorView[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DailyAssignment | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AssignmentView | null>(null);

  const today = localToday();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        api.get<DailyAssignment[]>('/admin/assignments'),
        api.get<Collector[]>('/admin/collectors'),
      ]);
      setAssignments(a.map(normalizeAssignment));
      setCollectors(c.map(normalizeCollector));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load assignments');
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
    return assignments
      .filter((a) => {
        const dateKey = formatDateKey(a.assignmentDate);
        const matchesSearch =
          !q ||
          a.id.toLowerCase().includes(q) ||
          a.collectorName?.toLowerCase().includes(q) ||
          a.collectorLoginId?.toLowerCase().includes(q);

        let matchesDate = true;
        if (dateFilter === 'TODAY') matchesDate = dateKey === today;
        else if (dateFilter === 'FUTURE') matchesDate = dateKey > today;
        else if (dateFilter === 'PAST') matchesDate = dateKey < today;

        return matchesSearch && matchesDate;
      })
      .sort((a, b) => b.assignmentDate.localeCompare(a.assignmentDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, search, dateFilter]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (values: AssignmentFormValues) => {
    try {
      if (editing) {
        await api.patch(`/admin/assignments/${editing.id}`, values);
        toast.success(`Assignment ${editing.id} updated`);
      } else {
        await api.post('/admin/assignments', values);
        toast.success(`Assignment created`);
      }
      setFormOpen(false);
      setEditing(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save assignment');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (a: AssignmentView) => {
    setEditing({
      id: a.id,
      collectorId: a.collectorId,
      assignmentDate: a.assignmentDate,
      createdAt: a.createdAt,
      updatedAt: a.createdAt,
      collector: null,
    });
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.delete(`/admin/assignments/${pendingDelete.id}`);
      toast.success(`Assignment ${pendingDelete.id} deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete assignment');
    }
    setPendingDelete(null);
  };

  const columns: Column<AssignmentView>[] = [
    {
      key: 'id',
      header: 'Assignment',
      render: (a: AssignmentView) => (
        <span
          className="cell-primary"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/assignments/${a.id}`)}
        >
          <span className="oct-icon small octagonal oct-light">
            <CalendarDays />
          </span>
          <span>
            <span className="cell-title mono">{a.id}</span>
            <div className="cell-sub">{formatDateKey(a.assignmentDate)}</div>
          </span>
        </span>
      ),
    },
    {
      key: 'collector',
      header: 'Collector',
      render: (a: AssignmentView) => (
        <span style={{ fontWeight: 600 }}>{a.collectorName ?? '—'}</span>
      ),
    },
    {
      key: 'loginId',
      header: 'Login ID',
      render: (a: AssignmentView) => (
        <span className="mono" style={{ fontSize: 12.5 }}>
          {a.collectorLoginId ?? '—'}
        </span>
      ),
    },
    {
      key: 'mobile',
      header: 'Collector Mobile',
      render: (a: AssignmentView) => (
        <span className="mono" style={{ fontSize: 12.5 }}>
          {a.collectorMobile ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      align: 'right',
      render: (a: AssignmentView) => (
        <span className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <IconButton label="View" onClick={() => navigate(`/assignments/${a.id}`)}>
            <Eye size={16} />
          </IconButton>
          <IconButton label="Edit" onClick={() => openEdit(a)}>
            <Pencil size={15} />
          </IconButton>
          <IconButton label="Delete" danger onClick={() => setPendingDelete(a)}>
            <Trash2 size={15} />
          </IconButton>
        </span>
      ),
    },
  ];

  const hasFilters = Boolean(search) || dateFilter !== 'ALL';

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <p>{assignments.length} assignments · {filtered.length} match your filters</p>
        </div>
        <div className="page-actions">
          <PrimaryButton onClick={openCreate}>
            <Plus size={15} /> Create Assignment
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
          placeholder="Search assignment ID or collector…"
          label="Search assignments"
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
        {hasFilters && (
          <button
            type="button"
            className="reset-filter"
            onClick={() => {
              setSearch('');
              setDateFilter('ALL');
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
          rowKey={(a) => a.id}
          loading={loading}
          onRowClick={(a) => navigate(`/assignments/${a.id}`)}
          emptyState={
            <EmptyState
              icon="clipboard"
              title="No assignments found"
              description={
                hasFilters
                  ? 'No assignments match the current search or filters.'
                  : 'No assignments yet. Create the first daily assignment to plan collection routes.'
              }
              action={
                !hasFilters ? (
                  <PrimaryButton onClick={openCreate}>
                    <Plus size={15} /> Create Assignment
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

      <AssignmentFormModal
        open={formOpen}
        initial={editing}
        collectors={collectors}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={pendingDelete !== null}
        title="Delete assignment"
        message={`Assignment ${pendingDelete?.id} for ${pendingDelete?.collectorName ?? 'this collector'} will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}