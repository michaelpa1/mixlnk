import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AudioWaveform as Waveform } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isLoginPage = location.pathname === '/login';
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  // Don't show header/footer on login page or dashboard pages
  if (isLoginPage || isDashboardPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Waveform className="h-8 w-8 text-indigo-500" />
              <span className="text-xl font-semibold">Mixlnk</span>
            </Link>
            <div className="flex items-center gap-6">
              {!user ? (
                <>
                  <a href="#pricing" className="text-white/60 hover:text-white transition-colors">
                    Pricing
                  </a>
                  <a href="#faq" className="text-white/60 hover:text-white transition-colors">
                    FAQs
                  </a>
                  <Link to="/contact" className="text-white/60 hover:text-white transition-colors">
                    Contact
                  </Link>
                  <Link to="/login" className="text-white/60 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/contact" className="text-white/60 hover:text-white transition-colors">
                    Contact
                  </Link>
                  <Link
                    to="/dashboard/broadcast"
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Waveform className="h-6 w-6 text-indigo-500" />
              <span className="text-white/60">© 2024 Mixlnk. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-white/60 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-white/60 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/contact" className="text-white/60 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}