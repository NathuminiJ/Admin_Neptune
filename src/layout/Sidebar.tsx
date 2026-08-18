import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  Truck,
  UserCog,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { NeptuneMark } from '../components/NeptuneLogo';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/collectors', label: 'Collectors', icon: Users },
  { to: '/riders', label: 'Riders', icon: UserCog },
  { to: '/vehicles', label: 'Vehicles', icon: Truck },
  { to: '/assignments', label: 'Assignments', icon: CalendarDays },
  { to: '/requests', label: 'Collection Requests', icon: ClipboardList },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = () => {
    setConfirmOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark">
            <NeptuneMark size={28} />
          </span>
          <span>
            <span className="sidebar-brand-name mono">NEPTUNE</span>
            <div className="sidebar-brand-sub">Waste Collection</div>
          </span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <button type="button" className="nav-logout" onClick={() => setConfirmOpen(true)}>
            <LogOut />
            Logout
          </button>
        </div>
      </aside>

      <ConfirmationDialog
        open={confirmOpen}
        title="Logout of NEPTUNE"
        message="You are about to end this admin session. Any unsaved changes will be lost."
        confirmLabel="Logout"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}