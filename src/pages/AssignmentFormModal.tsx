import { CalendarDays, ClipboardPlus, Phone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AssignmentStatus, Collector, DailyAssignment } from '../types';
import { Avatar } from '../components/Avatar';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { PrimaryButton, SecondaryButton } from '../components/buttons';

export interface AssignmentFormValues {
  date: string;
  collectorId: string;
  area: string;
  status: AssignmentStatus;
}

interface AssignmentFormModalProps {
  open: boolean;
  initial?: DailyAssignment | null;
  collectors: Collector[];
  onClose: () => void;
  onSave: (values: AssignmentFormValues) => void;
}

type FormErrors = Partial<Record<keyof AssignmentFormValues, string>>;

export function AssignmentFormModal({
  open,
  initial,
  collectors,
  onClose,
  onSave,
}: AssignmentFormModalProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [collectorId, setCollectorId] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<AssignmentStatus>('SCHEDULED');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      if (initial) {
        setDate(initial.date);
        setCollectorId(initial.collectorId);
        setArea(initial.area);
        setStatus(initial.status);
      } else {
        setDate(new Date().toISOString().slice(0, 10));
        setCollectorId('');
        setArea('');
        setStatus('SCHEDULED');
      }
      setErrors({});
      setSaving(false);
    }
  }, [open, initial]);

  const collector = useMemo(
    () => collectors.find((c) => c.id === collectorId) ?? null,
    [collectors, collectorId],
  );

  const handleCollectorChange = (id: string) => {
    setCollectorId(id);
    const c = collectors.find((col) => col.id === id);
    setArea(c?.area ?? '');
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!date) next.date = 'Date is required';
    if (!collectorId) next.collectorId = 'Select a collector';
    return next;
  };

  const handleSave = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    window.setTimeout(() => {
      onSave({ date, collectorId, area: (area.trim() || collector?.area) ?? '', status });
    }, 600);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <>
          <ClipboardPlus />
          {isEdit ? 'Edit Assignment' : 'Create Assignment'}
        </>
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} loading={saving}>
            {isEdit ? 'Save Changes' : 'Create Assignment'}
          </PrimaryButton>
        </>
      }
    >
      <div className="form-grid">
        <FormField label="Date" required error={errors.date}>
          <div className="input-with-icon">
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <CalendarDays />
          </div>
        </FormField>

        <FormField label="Collector" required error={errors.collectorId}>
          <select
            className="select"
            value={collectorId}
            onChange={(e) => handleCollectorChange(e.target.value)}
          >
            <option value="">Select a collector…</option>
            {collectors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.loginId})
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Status" required>
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </FormField>

        <FormField
          label="Assigned Area"
          error={errors.area}
          hint="Pre-filled from the selected collector's base area."
        >
          <input
            className="input"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder={collector ? collector.area : 'Select a collector to pre-fill'}
            disabled={!collector}
          />
        </FormField>
      </div>

      {collector ? (
        <div className="assignment-collector" style={{ marginTop: 16 }}>
          <Avatar name={collector.fullName} />
          <span style={{ minWidth: 0 }}>
            <span className="ac-title">{collector.fullName}</span>
            <div className="ac-meta">
              <Phone size={11} style={{ verticalAlign: '-1px', display: 'inline' }} />{' '}
              {collector.mobile} · {collector.nic}
            </div>
          </span>
          {collector.status !== 'ACTIVE' && (
            <span className="badge badge-amber" style={{ marginLeft: 'auto' }}>
              Inactive collector
            </span>
          )}
        </div>
      ) : (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 16 }}>
          Select a collector to see their contact information here. Assignment areas can be
          adjusted afterwards.
        </p>
      )}
    </Modal>
  );
}