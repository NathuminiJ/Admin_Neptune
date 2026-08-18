import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CollectorsPage } from './pages/CollectorsPage';
import { CollectorDetailsPage } from './pages/CollectorDetailsPage';
import { RidersPage } from './pages/RidersPage';
import { RiderDetailsPage } from './pages/RiderDetailsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { VehicleDetailsPage } from './pages/VehicleDetailsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { AssignmentDetailsPage } from './pages/AssignmentDetailsPage';
import { CollectionRequestsPage } from './pages/CollectionRequestsPage';
import { RequestDetailsPage } from './pages/RequestDetailsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SettingsPage } from './pages/SettingsPage';

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/collectors" element={<CollectorsPage />} />
          <Route path="/collectors/:id" element={<CollectorDetailsPage />} />
          <Route path="/riders" element={<RidersPage />} />
          <Route path="/riders/:id" element={<RiderDetailsPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailsPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/assignments/:id" element={<AssignmentDetailsPage />} />
          <Route path="/requests" element={<CollectionRequestsPage />} />
          <Route path="/requests/:id" element={<RequestDetailsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}