import { ChevronDown, LogOut, Menu, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { useClickOutside } from '../hooks';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

function pageHeading(pathname: string): { title: string; subtitle: string } {
  if (pathname === '/') return { title: 'Dashboard', subtitle: 'System overview' };
  if (pathname.startsWith('/collectors'))
    return pathname.length > '/collectors'.length
      ? { title: 'Collector Details', subtitle: 'Collector profile' }
      : { title: 'Collectors', subtitle: 'Manage waste collection staff' };
  if (pathname.startsWith('/riders'))
    return pathname.length > '/riders'.length
      ? { title: 'Rider Details', subtitle: 'Rider profile' }
      : { title: 'Riders', subtitle: 'Manage collection riders' };
  if (pathname.startsWith('/vehicles'))
    return pathname.length > '/vehicles'.length
      ? { title: 'Vehicle Details', subtitle: 'Vehicle information' }
      : { title: 'Vehicles', subtitle: 'Manage the fleet' };
  if (pathname.startsWith('/assignments'))
    return pathname.length > '/assignments'.length
      ? { title: 'Assignment Details', subtitle: 'Daily assignment' }
      : { title: 'Assignments', subtitle: 'Plan daily collection routes' };
  if (pathname.startsWith('/requests'))
    return pathname.length > '/requests'.length
      ? { title: 'Collection Request', subtitle: 'Request NQ details' }
      : { title: 'Collection Requests', subtitle: 'All collection requests' };
  if (pathname.startsWith('/reports')) return { title: 'Reports', subtitle: 'Operational and activity reports' };
  if (pathname.startsWith('/settings')) return { title: 'Settings', subtitle: 'Admin preferences' };
  return { title: 'NEPTUNE', subtitle: 'Waste collection management' };
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useClickOutside<HTMLDivElement>(() => setProfileOpen(false));

  const heading = useMemo(() => pageHeading(pathname), [pathname]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header">
      <button
        type="button"
        className="header-menu"
        aria-label="Toggle navigation menu"
        onClick={onToggleSidebar}
      >
        <Menu size={19} />
      </button>

      <div className="header-title-wrap">
        <h1 className="header-title">{heading.title}</h1>
        <div className="header-subtitle">{heading.subtitle}</div>
      </div>

      <div className="header-right">
        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="header-profile"
            aria-label="Admin profile menu"
            onClick={() => setProfileOpen((v) => !v)}
          >
            <Avatar name={admin?.loginId ?? 'Admin'} tone="deep" />
            <span>
              <span className="profile-name">{admin?.loginId ?? 'Admin'}</span>
              <div className="profile-role">{admin?.role ?? 'ADMIN'}</div>
            </span>
            <ChevronDown size={14} style={{ color: 'var(--np-ink-3)' }} />
          </button>
          {profileOpen && (
            <div className="dropdown-menu align-right profile-menu">
              <div className="pm-head">
                <div className="pm-name">{admin?.loginId ?? 'Admin'}</div>
                <div className="pm-role">{admin?.role ?? 'ADMIN'}</div>
                <div className="pm-user-id mono">ID: {admin?.id ?? '—'}</div>
              </div>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings');
                }}
              >
                <Settings size={15} />
                Settings
              </button>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item"
                style={{ color: 'var(--np-danger)' }}
                onClick={handleLogout}
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}