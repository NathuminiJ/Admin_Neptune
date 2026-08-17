import { Bike, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Rider, RiderVehicleType } from '../types';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { TukIcon } from '../components/icons';
import { VEHICLE_COLOURS } from '../data/mock';
import { colourHex, validateSriLankanNic, getNicHint } from '../utils/format';

export interface RiderFormValues {
  fullName: string;
  loginId: string;
  password: string;
  nic: string;
  mobile: string;
  address: string;
  vehicleType: RiderVehicleType | '';
  vehicleNumber: string;
  vehicleColour: string;
}

interface RiderFormModalProps {
  open: boolean;
  initial?: Rider | null;
  onClose: () => void;
  onSave: (values: RiderFormValues) => void;
}

type FormErrors = Partial<Record<keyof RiderFormValues, string>>;

const emptyForm = (): RiderFormValues => ({
  fullName: '',
  loginId: '',
  password: '',
  nic: '',
  mobile: '',
  address: '',
  vehicleType: 'TUK',
  vehicleNumber: '',
  vehicleColour: 'GREEN',
});

const toValues = (r: Rider): RiderFormValues => ({
  fullName: r.fullName,
  loginId: r.loginId,
  password: '',
  nic: r.nic,
  mobile: r.mobile,
  address: r.address,
  vehicleType: r.vehicleType,
  vehicleNumber: r.vehicleNumber,
  vehicleColour: r.vehicleColour,
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
    else if (form.loginId.trim().length < 4) next.loginId = 'Login ID must be at least 4 characters';
    if (!isEdit && !form.password) next.password = 'Password is required';
    else if (!isEdit && form.password.length < 4) next.password = 'Password must be 4+ characters';
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
    if (!form.vehicleType) {
      next.vehicleType = 'Vehicle type is required';
    } else {
      if (!form.vehicleNumber.trim()) next.vehicleNumber = 'Vehicle number is required';
      else if (form.vehicleNumber.trim().length < 3)
        next.vehicleNumber = 'Vehicle number looks too short';
      if (!form.vehicleColour) next.vehicleColour = 'Vehicle colour is required';
    }
    return next;
  };

  const vehicleTypeLabel =
    form.vehicleType === 'TUK' ? 'Tuk (Three-Wheeler)' : form.vehicleType === 'BIKE' ? 'Bike (Motorcycle)' : '';

  const VehicleIcon = form.vehicleType === 'BIKE' ? Bike : TukIcon;

  const handleSave = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    window.setTimeout(() => {
      onSave({ ...form, password: isEdit ? '' : form.password });
    }, 600);
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

      <div className="form-section" style={{ marginTop: 18 }}>
        <div className="form-section-title">
          <TukIcon /> Vehicle
        </div>

        <div className="form-grid">
          <FormField
            label="Vehicle Type"
            required
            error={errors.vehicleType}
            hint="Select the vehicle this rider uses for collections."
          >
            <select
              className="select"
              value={form.vehicleType}
              onChange={(e) => {
                const value = e.target.value;
                set('vehicleType', value as 'TUK' | 'BIKE' | '');
                if (!value) {
                  set('vehicleNumber', '');
                }
              }}
            >
              <option value="">Not Assigned</option>
              <option value="TUK">Tuk (Three-Wheeler)</option>
              <option value="BIKE">Bike (Motorcycle)</option>
            </select>
          </FormField>

          <FormField
            label="Vehicle Number"
            required={Boolean(form.vehicleType)}
            error={errors.vehicleNumber}
            hint="Registration number of the vehicle"
          >
            <input
              className="input mono"
              value={form.vehicleNumber}
              onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())}
              placeholder={form.vehicleType ? 'e.g. NPC-4562' : 'Select a vehicle type first'}
              disabled={!form.vehicleType}
            />
          </FormField>

          <FormField
            label="Vehicle Colour"
            required={Boolean(form.vehicleType)}
            error={errors.vehicleColour}
            hint="Colour of the vehicle body"
          >
            <select
              className="select"
              value={form.vehicleColour}
              onChange={(e) => set('vehicleColour', e.target.value)}
              disabled={!form.vehicleType}
            >
              {VEHICLE_COLOURS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {form.vehicleType ? (
          <div className="vehicle-preview" style={{ marginTop: 16 }}>
            <span className="oct-icon small octagonal oct-green">
              <VehicleIcon />
            </span>
            <span>
              <span className="vp-title">
                {vehicleTypeLabel} — {form.vehicleNumber || 'No number yet'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="swatch" style={{ background: colourHex(form.vehicleColour) }} />
                {form.vehicleColour.charAt(0) + form.vehicleColour.slice(1).toLowerCase()} vehicle
              </div>
            </span>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
            No vehicle assigned — the rider will be linked to one later.
          </p>
        )}
      </div>
    </Modal>
  );
}