import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { BroadcasterPage } from './pages/BroadcasterPage';
import { ListenerPage } from './pages/ListenerPage';
import { SettingsPage } from './pages/SettingsPage';
import { ListenersPage } from './pages/ListenersPage';
import { LandingPage } from './pages/LandingPage';
import { AuthRequired } from './components/AuthRequired';
import { DashboardLayout } from './components/DashboardLayout';
import { MainLayout } from './components/MainLayout';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/stream/:streamId" element={<ListenerPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <AuthRequired>
            <DashboardLayout />
          </AuthRequired>
        }
      >
        <Route index element={<Navigate to="broadcast" replace />} />
        <Route path="broadcast" element={<BroadcasterPage />} />
        <Route path="listeners" element={<ListenersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Redirect old routes to dashboard */}
      <Route path="/broadcast" element={<Navigate to="/dashboard/broadcast" replace />} />
      <Route path="/listeners" element={<Navigate to="/dashboard/listeners" replace />} />
      <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
    </Routes>
  );
}

export default App;