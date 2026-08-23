import { GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { University } from '../types';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { PrimaryButton, SecondaryButton } from '../components/buttons';

export interface UniversityFormValues {
  name: string;
}

interface UniversityFormModalProps {
  open: boolean;
  initial?: University | null;
  /** Case-insensitive names already in the list (excluding the edited row). */
  existingNames: string[];
  onClose: () => void;
  onSave: (values: UniversityFormValues) => Promise<void> | void;
}

type FormErrors = Partial<Record<keyof UniversityFormValues, string>>;

export function UniversityFormModal({
  open,
  initial,
  existingNames,
  onClose,
  onSave,
}: UniversityFormModalProps) {
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setErrors({});
      setSaving(false);
    }
  }, [open, initial]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const trimmed = name.trim();
    if (!trimmed) {
      next.name = 'University name is required';
    } else if (trimmed.length < 2) {
      next.name = 'University name must be at least 2 characters';
    } else if (
      existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())
    ) {
      next.name = 'A university with this name already exists';
    }
    return next;
  };

  const handleSave = async () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await onSave({ name: trimmedName(name) });
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
          <GraduationCap />
          {isEdit ? 'Edit University' : 'Add University'}
        </>
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} loading={saving}>
            {isEdit ? 'Save Changes' : 'Save University'}
          </PrimaryButton>
        </>
      }
    >
      <div className="form-grid">
        <FormField
          label="University Name"
          required
          error={errors.name}
          hint="e.g. Peradeniya, AIBT, APIIT"
          className="span-2"
        >
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter university name"
            maxLength={120}
          />
        </FormField>
      </div>
    </Modal>
  );
}

function trimmedName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
