import {
  CalendarDays,
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeptuneLogo, NeptuneMark } from '../components/NeptuneLogo';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface FormErrors {
  loginId?: string;
  password?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!loginId.trim()) next.loginId = 'Login ID is required';
    if (!password) next.password = 'Password is required';
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await login(loginId.trim(), password, remember);
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrors({
        loginId: err.message || 'Authentication failed. Please check your credentials.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <aside className="login-brand">
        <div className="login-brand-deco d1" aria-hidden="true" />
        <div className="login-brand-deco d2" aria-hidden="true" />
        <div className="login-brand-deco d3" aria-hidden="true" />

        <NeptuneLogo size={54} wordmark tone="light" subtitle="Waste Collection" />

        <h2>
          Admin Portal for
          <br />
          waste collection management.
        </h2>
        <p>
          Manage collectors, riders, vehicles, daily assignments and collection requests — all
          from one clean control centre.
        </p>

        <ul className="login-features">
          <li>
            <span className="login-feature-ic">
              <CalendarDays />
            </span>
            Plan daily collection assignments
          </li>
          <li>
            <span className="login-feature-ic">
              <Truck />
            </span>
            Track vehicles and riders in the field
          </li>
          <li>
            <span className="login-feature-ic">
              <MapPin />
            </span>
            Follow every collection request to completion
          </li>
        </ul>
      </aside>

      <div className="login-panel">
        <div className="login-card">
          <div className="login-logo-row">
            <span className="oct-icon octagonal oct-deep">
              <NeptuneMark size={24} />
            </span>
            <div>
              <h1 className="login-title">Admin Portal</h1>
              <div className="login-subtitle" style={{ margin: 0 }}>
                Sign in to manage the NEPTUNE system
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field" style={{ marginBottom: 16 }}>
              <label className="field-label">
                Login ID <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  className="input"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. ADMIN01"
                  autoComplete="username"
                  aria-invalid={Boolean(errors.loginId)}
                />
                <KeyRound />
              </div>
              {errors.loginId && (
                <span className="field-error" role="alert">
                  {errors.loginId}
                </span>
              )}
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label className="field-label">
                Password <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <span className="field-error" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="login-options">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <button type="button" className="link-btn" onClick={() => setForgotOpen(true)}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner" /> Signing in…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Login to Dashboard
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            NEPTUNE Waste Collection Management System — Admin Dashboard
          </div>
        </div>
      </div>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        size="sm"
        title="Forgot password"
        footer={
          <button className="btn btn-primary" onClick={() => setForgotOpen(false)}>
            Got it
          </button>
        }
      >
        <p style={{ fontSize: 13.5, color: 'var(--np-ink-2)', lineHeight: 1.6 }}>
          Password resets are handled by the system administrator. Please contact the NEPTUNE
          support team to recover your admin account access.
        </p>
      </Modal>
    </div>
  );
}