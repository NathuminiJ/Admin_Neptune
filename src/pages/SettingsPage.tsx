import { Save, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/buttons';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function SettingsPage() {
  const { admin } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [mobile, setMobile] = useState(admin?.mobile ?? '');

  const [notifRequests, setNotifRequests] = useState(true);
  const [notifAssignments, setNotifAssignments] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    window.setTimeout(() => {
      setSavingProfile(false);
      toast.success('Admin profile updated');
    }, 700);
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <p>Admin profile and notification preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">
              <UserRound /> Admin Profile
            </h3>
          </div>
          <form className="card-body" onSubmit={handleSaveProfile}>
            <div className="form-grid">
              <FormField label="Full Name" required>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label="Email Address" required>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>
              <FormField label="Mobile" required>
                <input
                  className="input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </FormField>
              <FormField label="Role">
                <input
                  className="input"
                  value={admin?.role ?? 'ADMIN'}
                  disabled
                  aria-describedby="role-hint"
                />
              </FormField>
              <div className="info-item span-2">
                <div className="k">Login ID</div>
                <div className="v mono normal">{admin?.loginId ?? 'ADMIN01'}</div>
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton type="submit" loading={savingProfile}>
                <Save size={15} /> Save Profile
              </PrimaryButton>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">
              <ShieldCheck /> Notifications
            </h3>
          </div>
          <div className="card-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
            <div className="setting-row">
              <span>
                <span className="sr-title">New collection requests</span>
                <div className="sr-desc">
                  Get notified when a collector submits a collection request.
                </div>
              </span>
              <ToggleSwitch
                checked={notifRequests}
                onChange={setNotifRequests}
                label="New collection requests"
              />
            </div>
            <div className="setting-row">
              <span>
                <span className="sr-title">Assignment reminders</span>
                <div className="sr-desc">Daily reminders about scheduled assignments.</div>
              </span>
              <ToggleSwitch
                checked={notifAssignments}
                onChange={setNotifAssignments}
                label="Assignment reminders"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}