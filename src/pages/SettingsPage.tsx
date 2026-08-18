import { ShieldCheck, UserRound } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { admin } = useAuth();

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <p>Your admin account information, as stored on the Neptune backend.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">
              <UserRound /> Admin Profile
            </h3>
          </div>
          <div className="card-body">
            <div className="info-list">
              <div className="info-item">
                <div className="k">Login ID</div>
                <div className="v mono normal">{admin?.loginId ?? '—'}</div>
              </div>
              <div className="info-item">
                <div className="k">Role</div>
                <div className="v normal">{admin?.role ?? '—'}</div>
              </div>
              <div className="info-item">
                <div className="k">Status</div>
                <div className="v">
                  {admin ? <StatusBadge status={admin.status} /> : '—'}
                </div>
              </div>
              <div className="info-item">
                <div className="k">User ID</div>
                <div className="v mono normal">{admin?.id ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">
              <ShieldCheck /> Account
            </h3>
          </div>
          <div className="card-body">
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Profile editing is managed by the Neptune backend. This dashboard shows the account
              currently authenticated with{' '}
              <span className="mono" style={{ fontSize: 12 }}>
                {admin?.loginId ?? '—'}
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}