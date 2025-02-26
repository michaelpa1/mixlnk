import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AudioWaveform as Waveform } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isLandingPage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isStreamPage = location.pathname.startsWith('/stream/');

  // Don't show header/footer on login page
  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      {/* Header - Only show on landing and stream pages */}
      {(isLandingPage || isStreamPage) && (
        <header className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <Waveform className="h-8 w-8 text-indigo-500" />
                <span className="text-xl font-semibold">Mixlnk</span>
              </Link>
              {isLandingPage && (
                <div className="flex items-center gap-6">
                  <a href="#pricing" className="text-white/60 hover:text-white transition-colors">
                    Pricing
                  </a>
                  <a href="#faq" className="text-white/60 hover:text-white transition-colors">
                    FAQs
                  </a>
                  {user ? (
                    <Link
                      to="/dashboard/broadcast"
                      className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
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
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer - Only show on landing and stream pages */}
      {(isLandingPage || isStreamPage) && (
        <footer className="border-t border-white/10 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waveform className="h-6 w-6 text-indigo-500" />
                <span className="text-lg font-semibold">Mixlnk</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Link to="/terms" className="text-white/60 hover:text-white transition-colors">
                  Terms
                </Link>
                <Link to="/privacy" className="text-white/60 hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link to="/contact" className="text-white/60 hover:text-white transition-colors">
                  Contact
                </Link>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-white/60">
              <p>© 2025 Mixlnk. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}