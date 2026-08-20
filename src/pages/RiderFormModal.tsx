import { UserCog } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { RiderView, Vehicle } from '../types';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { api } from '../lib/api';
import { validateSriLankanNic, normalizeNic, getNicHint } from '../utils/format';

export interface RiderFormValues {
  fullName: string;
  loginId: string;
  password: string;
  nic: string;
  mobile: string;
  address: string;
  /** Selected vehicle id; '' means no vehicle assigned. */
  vehicleId: string;
}

export type RiderPayload = Omit<RiderFormValues, 'password' | 'vehicleId'> & {
  password?: string;
  vehicleId?: string | null;
};

interface RiderFormModalProps {
  open: boolean;
  initial?: RiderView | null;
  onClose: () => void;
  onSave: (values: RiderPayload) => Promise<void> | void;
}

type FormErrors = Partial<Record<keyof RiderFormValues, string>>;

const NO_VEHICLE = '';

const emptyForm = (): RiderFormValues => ({
  fullName: '',
  loginId: '',
  password: '',
  nic: '',
  mobile: '',
  address: '',
  vehicleId: NO_VEHICLE,
});

const toValues = (r: RiderView): RiderFormValues => ({
  fullName: r.fullName,
  loginId: r.loginId,
  password: '',
  nic: r.nic,
  mobile: r.mobile,
  address: r.address,
  vehicleId: r.vehicleId ?? NO_VEHICLE,
});

function isValidMobile(value: string): boolean {
  const digits = value.replace(/[^\d]/g, '');
  return digits.length === 10 && digits.startsWith('0');
}

export function RiderFormModal({ open, initial, onClose, onSave }: RiderFormModalProps) {
  const [form, setForm] = useState<RiderFormValues>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      setForm(initial ? toValues(initial) : emptyForm());
      setErrors({});
      setSaving(false);
    }
  }, [open, initial]);

  const fetchVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    setVehiclesError(null);
    try {
      const data = await api.get<Vehicle[]>('/admin/vehicles');
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setVehiclesError(
        err.message || 'Could not load vehicles. Close and reopen the form to retry.',
      );
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchVehicles();
  }, [open, fetchVehicles]);

  const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE');
  const currentVehicle = initial?.vehicleId
    ? vehicles.find((v) => v.id === initial.vehicleId) ?? null
    : null;
  const showInactiveCurrent =
    isEdit && currentVehicle && currentVehicle.status !== 'ACTIVE';

  const set = <K extends keyof RiderFormValues>(key: K, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.loginId.trim()) next.loginId = 'Login ID is required';
    if (!isEdit && !form.password) {
      next.password = 'Password is required';
    } else if (form.password && form.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }
    if (!form.nic.trim()) {
      next.nic = 'NIC is required';
    } else {
      const nicResult = validateSriLankanNic(form.nic);
      if (!nicResult.valid) {
        next.nic = nicResult.error || 'Invalid NIC';
      }
    }
    if (!form.mobile.trim()) next.mobile = 'Mobile is required';
    else if (!isValidMobile(form.mobile)) next.mobile = 'Enter a valid 10-digit mobile';
    if (!form.address.trim()) next.address = 'Address is required';
    return next;
  };

  const handleSave = async () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      const payload: RiderPayload = {
        ...form,
        nic: normalizeNic(form.nic),
        vehicleId: form.vehicleId || null,
      };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit && payload.vehicleId === (initial?.vehicleId ?? null)) {
        delete payload.vehicleId;
      }
      await onSave(payload);
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
      size="lg"
      title={
        <>
          <UserCog />
          {isEdit ? 'Edit Rider' : 'Add Rider'}
        </>
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} loading={saving}>
            {isEdit ? 'Save Changes' : 'Save Rider'}
          </PrimaryButton>
        </>
      }
    >
      <div className="form-grid">
        <FormField label="Full Name" required error={errors.fullName}>
          <input
            className="input"
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="e.g. Thusitha Ranasinghe"
          />
        </FormField>
        <FormField label="Login ID" required error={errors.loginId}>
          <input
            className="input"
            value={form.loginId}
            onChange={(e) => set('loginId', e.target.value.toUpperCase())}
            placeholder="e.g. TR001"
          />
        </FormField>
        <FormField
          label="Password"
          required={!isEdit}
          error={errors.password}
          hint={
            isEdit
              ? 'Leave blank to keep the current password'
              : 'At least 8 characters'
          }
        >
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder={isEdit ? '••••••••' : 'Set a password'}
          />
        </FormField>
        <FormField label="NIC" required error={errors.nic} hint={getNicHint()}>
          <input
            className="input"
            value={form.nic}
            onChange={(e) => set('nic', e.target.value)}
            placeholder="e.g. 911234567V or 199112345678"
            maxLength={12}
          />
        </FormField>
        <FormField label="Mobile" required error={errors.mobile}>
          <input
            className="input"
            value={form.mobile}
            onChange={(e) => set('mobile', e.target.value)}
            placeholder="e.g. 077-345-6789"
          />
        </FormField>
        <FormField label="Address" required error={errors.address}>
          <input
            className="input"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="e.g. 102 Galle Road, Dehiwala"
          />
        </FormField>
        <FormField
          label="Assigned Vehicle"
          hint={vehiclesLoading ? 'Loading vehicles…' : undefined}
          error={vehiclesError ?? undefined}
          className="span-2"
        >
          {vehiclesError && !vehiclesLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select className="select" disabled value={NO_VEHICLE} aria-label="Assigned Vehicle">
                <option value={NO_VEHICLE}>Unavailable — vehicles could not be loaded</option>
              </select>
              <button
                type="button"
                className="link-btn"
                onClick={fetchVehicles}
                style={{ whiteSpace: 'nowrap' }}
              >
                Retry
              </button>
            </div>
          ) : (
            <select
              className="select"
              value={form.vehicleId}
              onChange={(e) => set('vehicleId', e.target.value)}
              disabled={vehiclesLoading}
              aria-label="Assigned Vehicle"
            >
              <option value={NO_VEHICLE}>
                {vehiclesLoading ? 'Loading vehicles…' : 'No Vehicle Assigned'}
              </option>
              {activeVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleCode} — {v.vehicleType}
                </option>
              ))}
              {showInactiveCurrent && currentVehicle && (
                <option key={`${currentVehicle.id}-current`} value={currentVehicle.id} disabled>
                  {currentVehicle.vehicleCode} — {currentVehicle.vehicleType} (inactive)
                </option>
              )}
            </select>
          )}
          {!vehiclesLoading &&
            !vehiclesError &&
            activeVehicles.length === 0 &&
            !showInactiveCurrent && (
              <span className="field-hint">No active vehicles available</span>
            )}
          {showInactiveCurrent && currentVehicle && !vehiclesError && (
            <span className="field-hint">
              Currently assigned to {currentVehicle.vehicleCode}, which is inactive. Pick an
              active vehicle to change the assignment.
            </span>
          )}
        </FormField>
      </div>
    </Modal>
  );
}