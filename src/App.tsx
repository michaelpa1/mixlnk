import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { BroadcasterPage } from './pages/BroadcasterPage';
import { ListenerPage } from './pages/ListenerPage';
import { SettingsPage } from './pages/SettingsPage';
import { ListenersPage } from './pages/ListenersPage';
import { FilesPage } from './pages/FilesPage';
import { LandingPage } from './pages/LandingPage';
import { AudioReviewPage } from './pages/AudioReviewPage';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { AuthRequired } from './components/AuthRequired';
import { DashboardLayout } from './components/DashboardLayout';
import { MainLayout } from './components/MainLayout';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="stream/:id" element={<ListenerPage />} />
        <Route path="listen/:id" element={<ListenerPage />} />
        <Route path="review/:shareId" element={<AudioReviewPage />} />
        <Route path="privacy" element={<div>Privacy Policy</div>} />
        <Route path="terms" element={<div>Terms of Service</div>} />
        <Route path="contact" element={<div>Contact Us</div>} />

        {/* Protected Dashboard Routes */}
        <Route
          path="dashboard"
          element={
            <AuthRequired>
              <DashboardLayout />
            </AuthRequired>
          }
        >
          <Route index element={<Navigate to="broadcast" replace />} />
          <Route path="broadcast" element={<BroadcasterPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="listeners" element={<ListenersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="diagnostic" element={<DiagnosticPage />} />
        </Route>

        {/* Redirect old routes to dashboard */}
        <Route path="broadcast" element={<Navigate to="/dashboard/broadcast" replace />} />
        <Route path="listeners" element={<Navigate to="/dashboard/listeners" replace />} />
        <Route path="settings" element={<Navigate to="/dashboard/settings" replace />} />
      </Route>
    </Routes>
  );
}

export default App;