import { Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Vehicle } from '../types';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { PrimaryButton, SecondaryButton } from '../components/buttons';

export interface VehicleFormValues {
  vehicleCode: string;
  vehicleType: string;
}

interface VehicleFormModalProps {
  open: boolean;
  initial?: Vehicle | null;
  onClose: () => void;
  onSave: (values: VehicleFormValues) => Promise<void> | void;
}

type FormErrors = Partial<Record<keyof VehicleFormValues, string>>;

const emptyForm = (): VehicleFormValues => ({
  vehicleCode: '',
  vehicleType: 'TUK',
});

export function VehicleFormModal({ open, initial, onClose, onSave }: VehicleFormModalProps) {
  const [form, setForm] = useState<VehicleFormValues>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              vehicleCode: initial.vehicleCode,
              vehicleType: initial.vehicleType,
            }
          : emptyForm(),
      );
      setErrors({});
      setSaving(false);
    }
  }, [open, initial]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.vehicleCode.trim()) next.vehicleCode = 'Vehicle code is required';
    else if (form.vehicleCode.trim().length < 4)
      next.vehicleCode = 'Vehicle code must be 4+ characters';
    if (!form.vehicleType.trim()) next.vehicleType = 'Vehicle type is required';
    return next;
  };

  const handleSave = async () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await onSave(form);
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
      size="sm"
      title={
        <>
          <Truck />
          {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
        </>
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} loading={saving}>
            {isEdit ? 'Save Changes' : 'Save Vehicle'}
          </PrimaryButton>
        </>
      }
    >
      <div className="form-grid">
        <FormField label="Vehicle Code" required error={errors.vehicleCode}>
          <input
            className="input mono"
            value={form.vehicleCode}
            onChange={(e) => setForm((prev) => ({ ...prev, vehicleCode: e.target.value.toUpperCase() }))}
            placeholder="e.g. VH-007"
          />
        </FormField>
        <FormField label="Vehicle Type" required error={errors.vehicleType}>
          <select
            className="select"
            value={form.vehicleType}
            onChange={(e) => setForm((prev) => ({ ...prev, vehicleType: e.target.value }))}
          >
            <option value="TRUCK">Truck (Waste Truck)</option>
            <option value="TUK">Tuk (Three-Wheeler)</option>
            <option value="BIKE">Bike (Motorcycle)</option>
          </select>
        </FormField>
      </div>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
        New vehicles start as Active. Use the power button on the vehicle list to deactivate or
        reactivate them.
      </p>
    </Modal>
  );
}