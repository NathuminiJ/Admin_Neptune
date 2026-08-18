import { UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RiderView } from '../types';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { validateSriLankanNic, getNicHint } from '../utils/format';

export interface RiderFormValues {
  fullName: string;
  loginId: string;
  password: string;
  nic: string;
  mobile: string;
  address: string;
}

export type RiderPayload = Omit<RiderFormValues, 'password'> & { password?: string };

interface RiderFormModalProps {
  open: boolean;
  initial?: RiderView | null;
  onClose: () => void;
  onSave: (values: RiderPayload) => Promise<void> | void;
}

type FormErrors = Partial<Record<keyof RiderFormValues, string>>;

const emptyForm = (): RiderFormValues => ({
  fullName: '',
  loginId: '',
  password: '',
  nic: '',
  mobile: '',
  address: '',
});

const toValues = (r: RiderView): RiderFormValues => ({
  fullName: r.fullName,
  loginId: r.loginId,
  password: '',
  nic: r.nic,
  mobile: r.mobile,
  address: r.address,
});

function isValidMobile(value: string): boolean {
  const digits = value.replace(/[^\d]/g, '');
  return digits.length === 10 && digits.startsWith('0');
}

export function RiderFormModal({ open, initial, onClose, onSave }: RiderFormModalProps) {
  const [form, setForm] = useState<RiderFormValues>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      setForm(initial ? toValues(initial) : emptyForm());
      setErrors({});
      setSaving(false);
    }
  }, [open, initial]);

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
      const payload: RiderPayload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
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
            onChange={(e) => set('nic', e.target.value.toUpperCase())}
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
      </div>
    </Modal>
  );
}