import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { EmptyState } from '../components/states';
import { IconButton, PrimaryButton } from '../components/buttons';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { University } from '../types';
import { formatDate } from '../utils/format';
import { UniversityFormModal } from './UniversityFormModal';
import type { UniversityFormValues } from './UniversityFormModal';

export function UniversitiesPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [pendingDelete, setPendingDelete] = useState<University | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<University[]>('/admin/universities');
      setUniversities(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load universities');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter((u) => u.name.toLowerCase().includes(q));
  }, [universities, search]);

  const existingNames = useMemo(
    () =>
      universities
        .filter((u) => u.id !== editing?.id)
        .map((u) => u.name),
    [universities, editing],
  );

  const handleSave = async (values: UniversityFormValues) => {
    try {
      if (editing) {
        await api.patch(`/admin/universities/${editing.id}`, values);
        toast.success(`University ${editing.name} updated`);
      } else {
        await api.post('/admin/universities', values);
        toast.success(`University ${values.name} added`);
      }
      setFormOpen(false);
      setEditing(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save university');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.delete(`/admin/universities/${pendingDelete.id}`);
      toast.success(`University ${pendingDelete.name} deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete university');
    }
    setPendingDelete(null);
  };

  const columns: Column<University>[] = [
    {
      key: 'name',
      header: 'University',
      render: (u: University) => (
        <span className="cell-primary">
          <Avatar name={u.name} tone="deep" />
          <span>
            <span className="cell-title">{u.name}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'id',
      header: 'ID',
      render: (u: University) => <span className="mono cell-sub">{u.id}</span>,
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (u: University) => (u.createdAt ? formatDate(u.createdAt) : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      render: (u: University) => (
        <span className="actions-cell">
          <IconButton
            label="Edit"
            onClick={() => {
              setEditing(u);
              setFormOpen(true);
            }}
          >
            <Pencil size={15} />
          </IconButton>
          <IconButton label="Delete" className="delete" onClick={() => setPendingDelete(u)}>
            <Trash2 size={15} />
          </IconButton>
        </span>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <p>
            {universities.length} universities registered · manage the list used across NEPTUNE
          </p>
        </div>
        <div className="page-actions">
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={15} /> Add University
          </PrimaryButton>
        </div>
      </div>

      <div className="toolbar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search universities…"
          label="Search universities"
        />
        {search && (
          <button type="button" className="reset-filter" onClick={() => setSearch('')}>
            Reset filters
          </button>
        )}
        <span className="toolbar-spacer" />
        <span className="pagination-info" style={{ fontSize: 12 }}>
          {loading ? 'Loading…' : `${filtered.length} shown`}
        </span>
      </div>

      <div className="table-card">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => u.id}
          loading={loading}
          emptyState={
            <EmptyState
              icon="inbox"
              title={search ? 'No matches' : 'No universities yet'}
              description={
                search
                  ? 'No universities match the current search.'
                  : 'Add your first university to start tracking collections by campus.'
              }
            />
          }
        />
      </div>

      <button
        type="button"
        className="link-btn"
        style={{ marginTop: 14 }}
        onClick={() => navigate('/')}
      >
        See today's distribution on the Dashboard
      </button>

      <UniversityFormModal
        open={formOpen}
        initial={editing}
        existingNames={existingNames}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={pendingDelete !== null}
        title="Delete university"
        message={`Are you sure you want to delete "${pendingDelete?.name ?? ''}"? This action cannot be undone. If the university is referenced by existing records, the backend may block the deletion.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
