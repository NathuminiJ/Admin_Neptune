import { QrCode, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CollectorView } from '../types';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { uid, validateSriLankanNic, normalizeNic, getNicHint } from '../utils/format';

export interface CollectorFormValues {
  fullName: string;
  loginId: string;
  password: string;
  nic: string;
  mobile: string;
  address: string;
  guardianName: string;
  guardianMobile: string;
  qrToken: string;
}

export type CollectorPayload = Omit<CollectorFormValues, 'password'> & { password?: string };

interface CollectorFormModalProps {
  open: boolean;
  initial?: CollectorView | null;
  onClose: () => void;
  onSave: (values: CollectorPayload) => Promise<void> | void;
}

type FormErrors = Partial<Record<keyof CollectorFormValues, string>>;

const emptyForm = (): CollectorFormValues => ({
  fullName: '',
  loginId: '',
  password: '',
  nic: '',
  mobile: '',
  address: '',
  guardianName: '',
  guardianMobile: '',
  qrToken: uid('QR'),
});

const toValues = (c: CollectorView): CollectorFormValues => ({
  fullName: c.fullName,
  loginId: c.loginId,
  password: '',
  nic: c.nic,
  mobile: c.mobile,
  address: c.address,
  guardianName: c.guardianName,
  guardianMobile: c.guardianMobile,
  qrToken: c.qrToken,
});

function isValidMobile(value: string): boolean {
  const digits = value.replace(/[^\d]/g, '');
  return digits.length === 10 && digits.startsWith('0');
}

export function CollectorFormModal({
  open,
  initial,
  onClose,
  onSave,
}: CollectorFormModalProps) {
  const [form, setForm] = useState<CollectorFormValues>(emptyForm());
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

  const set = <K extends keyof CollectorFormValues>(key: K, value: string) =>
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
    if (!form.guardianName.trim()) next.guardianName = 'Guardian name is required';
    if (!form.guardianMobile.trim()) next.guardianMobile = 'Guardian mobile is required';
    else if (!isValidMobile(form.guardianMobile))
      next.guardianMobile = 'Enter a valid 10-digit mobile';
    if (!form.qrToken.trim()) next.qrToken = 'QR token is required';
    return next;
  };

  const handleSave = async () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      const payload: CollectorPayload = { ...form, nic: normalizeNic(form.nic) };
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
          <UserRound />
          {isEdit ? 'Edit Collector' : 'Add Collector'}
        </>
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} loading={saving}>
            {isEdit ? 'Save Changes' : 'Save Collector'}
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
            placeholder="e.g. Kamal Perera"
          />
        </FormField>
        <FormField label="Login ID" required error={errors.loginId}>
          <input
            className="input"
            value={form.loginId}
            onChange={(e) => set('loginId', e.target.value.toUpperCase())}
            placeholder="e.g. KP001"
          />
        </FormField>
        <FormField
          label="Password"
          required={!isEdit}
          error={errors.password}
          hint={isEdit ? 'Leave blank to keep the current password' : undefined}
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
            placeholder="e.g. 921234567V or 199212345678"
            maxLength={12}
          />
        </FormField>
        <FormField label="Mobile" required error={errors.mobile}>
          <input
            className="input"
            value={form.mobile}
            onChange={(e) => set('mobile', e.target.value)}
            placeholder="e.g. 077-123-4567"
          />
        </FormField>
        <FormField label="Address" required error={errors.address}>
          <input
            className="input"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="e.g. 47 Galle Road, Dehiwala"
          />
        </FormField>
        <FormField label="Guardian Name" required error={errors.guardianName}>
          <input
            className="input"
            value={form.guardianName}
            onChange={(e) => set('guardianName', e.target.value)}
            placeholder="e.g. Somasiri Perera"
          />
        </FormField>
        <FormField label="Guardian Mobile" required error={errors.guardianMobile}>
          <input
            className="input"
            value={form.guardianMobile}
            onChange={(e) => set('guardianMobile', e.target.value)}
            placeholder="e.g. 077-223-4567"
          />
        </FormField>
        <FormField
          label="QR Token"
          required
          error={errors.qrToken}
          hint="Scanned by the collector's app when a collection is performed."
        >
          <div className="input-with-icon">
            <input
              className="input mono"
              value={form.qrToken}
              onChange={(e) => set('qrToken', e.target.value.toUpperCase())}
            />
            <QrCode />
          </div>
        </FormField>
      </div>
    </Modal>
  );
}