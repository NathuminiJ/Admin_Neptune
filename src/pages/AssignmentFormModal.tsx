import { CalendarDays, ClipboardPlus, Phone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CollectorView, DailyAssignment } from '../types';
import { Avatar } from '../components/Avatar';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { localToday, toDateKey } from '../utils/dates';

export interface AssignmentFormValues {
  assignmentDate: string;
  collectorId: string;
}

interface AssignmentFormModalProps {
  open: boolean;
  initial?: DailyAssignment | null;
  collectors: CollectorView[];
  onClose: () => void;
  onSave: (values: AssignmentFormValues) => Promise<void> | void;
}

type FormErrors = Partial<Record<keyof AssignmentFormValues, string>>;

export function AssignmentFormModal({
  open,
  initial,
  collectors,
  onClose,
  onSave,
}: AssignmentFormModalProps) {
  const [assignmentDate, setAssignmentDate] = useState(localToday());
  const [collectorId, setCollectorId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      if (initial) {
        setAssignmentDate(toDateKey(initial.assignmentDate));
        setCollectorId(initial.collectorId);
      } else {
        setAssignmentDate(localToday());
        setCollectorId('');
      }
      setErrors({});
      setSaving(false);
    }
  }, [open, initial]);

  const collector = useMemo(
    () => collectors.find((c) => c.id === collectorId) ?? null,
    [collectors, collectorId],
  );

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!assignmentDate) next.assignmentDate = 'Date is required';
    if (!collectorId) next.collectorId = 'Select a collector';
    return next;
  };

  const handleSave = async () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await onSave({ assignmentDate, collectorId });
    } catch {
      // Errors are surfaced by the caller (toast).
    } finally {
      setSaving(false);
    }
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
        <FormField label="Date" required error={errors.assignmentDate}>
          <div className="input-with-icon">
            <input
              className="input"
              type="date"
              value={assignmentDate}
              onChange={(e) => setAssignmentDate(e.target.value)}
            />
            <CalendarDays />
          </div>
        </FormField>

        <FormField label="Collector" required error={errors.collectorId}>
          <select
            className="select"
            value={collectorId}
            onChange={(e) => setCollectorId(e.target.value)}
          >
            <option value="">Select a collector…</option>
            {collectors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.loginId})
              </option>
            ))}
          </select>
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
          Select a collector to see their contact information here.
        </p>
      )}
    </Modal>
  );
}